import React, { Component } from 'react';
import PropTypes from 'prop-types';
import GraphiQL from 'graphiql';
import { GraphQLSchema } from 'graphql';
import { print, parse } from 'graphql';
import JSON2_MOD from '../helpers/json2-mod';

const basicTypesDefaultValues = {
  Float: 0.0,
  ID: '',
  Int: 0,
  String: '',
  Boolean: false
};

export default class GenerateMutation extends Component {
  static propTypes = {
    schema: PropTypes.instanceOf(GraphQLSchema),
    onUpdateQueryVariablesResponse: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      showMutationsPopup: false,
      mutationSearchText: ''
    };
  }

  getPrimaryAndSecondaryType(graphqlObject) {
    let type = graphqlObject.type;
    let typeConstructorName = type.constructor.name;

    if (this.isNonNull(typeConstructorName)) {
      type = type.ofType;
      typeConstructorName = type ? type.constructor.name : '';
    }

    let ofType = type.ofType;
    let ofTypeConstructorName = ofType ? ofType.constructor.name : '';

    if (this.isNonNull(ofTypeConstructorName)) {
      ofType = ofType.ofType;
      ofTypeConstructorName = ofType ? ofType.constructor.name : '';
    }

    return {
      primaryType: type,
      primaryTypeConstructorName: typeConstructorName,
      secondaryType: ofType,
      secondaryTypeConstructorName: ofTypeConstructorName
    };
  }

  isScalar(x) {
    return x === 'GraphQLScalarType';
  }

  isEnum(x) {
    return x === 'GraphQLEnumType';
  }

  isList(x) {
    return x === 'GraphQLList';
  }

  isNonNull(x) {
    return x === 'GraphQLNonNull';
  }

  isObjectType(x) {
    return x === 'GraphQLInputObjectType' || x === 'GraphQLObjectType';
  }

  isUnionType(x) {
    return x === 'GraphQLUnionType';
  }

  generateInputObject(graphqlObject) {
    const {
      primaryType,
      primaryTypeConstructorName,
      secondaryType,
      secondaryTypeConstructorName
    } = this.getPrimaryAndSecondaryType(graphqlObject);

    if (this.isScalar(primaryTypeConstructorName)) {
      const defaultValue = basicTypesDefaultValues[primaryType.name];
      return defaultValue === undefined ? null : defaultValue;
    }

    if (this.isScalar(secondaryTypeConstructorName)) {
      const defaultValue = basicTypesDefaultValues[secondaryType.name];
      if (this.isList(primaryTypeConstructorName)) {
        return [defaultValue === undefined ? null : defaultValue];
      }
      return defaultValue === undefined ? null : defaultValue;
    }

    if (this.isEnum(primaryTypeConstructorName)) {
      return primaryType.getValues()[0].value;
    }

    if (this.isEnum(secondaryTypeConstructorName)) {
      if (this.isList(primaryTypeConstructorName)) {
        return [secondaryType.getValues()[0].value];
      }
      return secondaryType.getValues()[0].value;
    }

    if (
      this.isObjectType(secondaryTypeConstructorName) ||
      this.isObjectType(primaryTypeConstructorName)
    ) {
      const fields = secondaryType
        ? secondaryType.getFields()
        : primaryType.getFields();
      const fieldsInputObject = {};
      Object.keys(fields).forEach(
        fieldKey =>
          (fieldsInputObject[fieldKey] = this.generateInputObject(
            fields[fieldKey]
          ))
      );
      if (this.isList(primaryTypeConstructorName)) {
        return [fieldsInputObject];
      }
      return fieldsInputObject;
    }

    return '';
  }

  getSubSelectionString(graphqlObject) {
    const type = graphqlObject.type;
    const typeConstructorName = type.constructor.name;
    const ofType = type.ofType;
    const ofTypeConstructorName = ofType ? ofType.constructor.name : '';

    if (
      this.isScalar(typeConstructorName) ||
      this.isScalar(ofTypeConstructorName)
    ) {
      return '';
    }

    if (
      this.isObjectType(ofTypeConstructorName) ||
      this.isObjectType(typeConstructorName)
    ) {
      const fields = ofType ? ofType.getFields() : type.getFields();
      if (Object.keys(fields).includes('id')) {
        return '{ id }';
      }

      const scalarKey = Object.keys(fields).find(fieldKey => {
        const fieldType = fields[fieldKey].type;
        const fieldTypeConstructorName = fieldType.constructor.name;
        const fieldOfType = fieldType.ofType;
        const fieldOfTypeConstructorName = fieldOfType
          ? fieldOfType.constructor.name
          : '';
        return (
          this.isScalar(fieldTypeConstructorName) ||
          this.isScalar(fieldOfTypeConstructorName)
        );
      });
      if (scalarKey) {
        return `{ ${scalarKey} }`;
      }

      const complexFieldKey = Object.keys(fields).sort()[0];
      const complexField = fields[complexFieldKey];
      return `{ ${this.generateOutputObjectString(complexField)} }`;
    }

    if (
      this.isUnionType(typeConstructorName) ||
      this.isUnionType(ofTypeConstructorName)
    ) {
      const unionTypes = this.isUnionType(typeConstructorName)
        ? type.getTypes()
        : ofType.getTypes();
      const subSelectionStringArray = unionTypes.map(item => {
        const wrapperObject = { type: item };
        const itemSubSelectionString = this.getSubSelectionString(
          wrapperObject
        );
        const unionTypeName = item.name;
        return `... on ${unionTypeName} ${itemSubSelectionString}`;
      });
      return `{ ${subSelectionStringArray.join('\n')} }`;
    }

    return '';
  }

  generateOutputObjectString(graphqlObject) {
    const args = graphqlObject.args;
    const argsStringArray = args.map(item => {
      const type = item.type;
      const typeConstructorName = type.constructor.name;
      const ofType = type.ofType;
      const ofTypeConstructorName = ofType ? ofType.constructor.name : '';

      const isBasicType =
        this.isScalar(typeConstructorName) ||
        this.isScalar(ofTypeConstructorName);

      const valueObject = this.generateInputObject(item);
      const valueObjectString = isBasicType
        ? JSON.stringify(valueObject)
        : JSON2_MOD.stringify(valueObject, null, '', true);
      return `${item.name}: ${valueObjectString}`;
    });
    let argsString = argsStringArray.join(',');
    if (argsString) {
      argsString = `(${argsString})`;
    }

    const subSelectionString = this.getSubSelectionString(graphqlObject);

    return `${graphqlObject.name} ${argsString} ${subSelectionString}`;
  }

  mutationPressed = mutationName => {
    const mutationFields = this.props.schema.getMutationType().getFields();
    const mutation = mutationFields[mutationName];
    const mutationArgs = mutation.args;

    const queryVariables = [];
    const inputs = mutationArgs.map((mutationArg, index) => {
      const type = mutationArg.type;
      const typeConstructorName = type.constructor.name;
      const ofType = type.ofType;
      const ofTypeConstructorName = ofType ? ofType.constructor.name : '';

      const isBasicType =
        this.isScalar(typeConstructorName) ||
        this.isScalar(ofTypeConstructorName);
      const valueObject = this.generateInputObject(mutationArg);

      if (!isBasicType) {
        queryVariables.push({
          name: '$input_' + index,
          type: ofType ? ofType.name : type.name,
          value: valueObject
        });
      }

      const valueObjectString = isBasicType
        ? JSON.stringify(valueObject)
        : '$input_' + index;
      return `${mutationArg.name}: ${valueObjectString}`;
    });
    let inputString = inputs.join(',');
    if (inputString) {
      inputString = `(${inputString})`;
    }

    let mutationInputString = queryVariables
      .map(item => `${item.name}: ${item.type}!`)
      .join(',');
    if (mutationInputString) {
      mutationInputString = `(${mutationInputString})`;
    }

    const queryVariablesObject = queryVariables.reduce(
      (previousValue, currentValue) => {
        previousValue[currentValue.name.slice(1)] = currentValue.value;
        return previousValue;
      },
      {}
    );

    const outputType = mutation.type;
    const outputOfType = outputType.ofType;
    const outputTypeConstructorName = outputType.constructor.name;
    const outputOfTypeConstructorName = outputOfType
      ? outputOfType.constructor.name
      : '';
    const isScalarOutputType =
      this.isScalar(outputTypeConstructorName) ||
      this.isScalar(outputOfTypeConstructorName);
    let outputString = '';
    if (!isScalarOutputType) {
      const outputFields = outputType.getFields();
      const outputStrings = Object.keys(outputFields).map(fieldKey => {
        const outputField = outputFields[fieldKey];
        return `${this.generateOutputObjectString(outputField)}`;
      });
      outputString = `{ ${outputStrings.join(',')} }`;
    }

    const queryString = `
      mutation ${mutationName}Mutation${mutationInputString} {
        ${mutationName}${inputString} ${outputString}
      }
    `;
    const prettyQuery = print(parse(queryString));
    const queryVariablesString = JSON.stringify(queryVariablesObject, null, 2);

    this.setState({
      showMutationsPopup: false,
      mutationSearchText: ''
    });
    if (this.props.onUpdateQueryVariablesResponse) {
      this.props.onUpdateQueryVariablesResponse(
        prettyQuery,
        queryVariablesString
      );
    }
  };

  handleMutationSearchTextChange = event =>
    this.setState({ mutationSearchText: event.target.value });

  handleToggleMutationsPopup = () =>
    this.setState({
      showMutationsPopup: !this.state.showMutationsPopup
    });

  renderMutationLabel = mutationName => (
    <div
      key={mutationName}
      className="menu-list-item"
      onClick={() => this.mutationPressed(mutationName)}
    >
      {mutationName}
    </div>
  );

  renderMutations = () => {
    if (!this.state.showMutationsPopup) {
      return null;
    }

    const mutation = this.props.schema.getMutationType();
    const mutationFields = mutation.getFields();

    const mutationSearchText = (
      this.state.mutationSearchText || ''
    ).toLowerCase();

    const mutationTitles = Object.keys(mutationFields)
      .filter(v => v.toLowerCase().includes(mutationSearchText))
      .sort();

    return (
      <div className="menu-popup">
        <input
          className="mutation-search-input"
          onChange={this.handleMutationSearchTextChange}
          type={'text'}
          placeholder={'Find mutation...'}
          autoFocus
        />
        {mutationTitles.map(this.renderMutationLabel)}
      </div>
    );
  }

  render() {
    const showGenerateMutation =
      this.props.schema && this.props.schema.getMutationType();
    if (!showGenerateMutation) {
      return null;
    }

    return (
      <div className="toolbar-button-wrapper">
        {this.renderMutations()}
        <GraphiQL.Button
          title={'Generate mutation query'}
          label={'Generate Mutation'}
          onClick={this.handleToggleMutationsPopup}
        />
      </div>
    );
  }
}

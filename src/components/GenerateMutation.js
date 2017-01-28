import React, { Component } from 'react';
import GraphiQL from 'graphiql';
import {
  print,
  parse
} from 'graphql';
import { autobind } from 'core-decorators';
import styles from './styles';
import JSON2_MOD from '../helpers/json2-mod';

const basicTypesDefaultValues = {
  Float: 0.0,
  ID: '',
  Int: 0,
  String: '',
  Boolean: false,
};

export default class GenerateMutation extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showMutationsPopup: false,
      mutationSearchText: '',
      mutationSearchInputFocused: false
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
    const type = graphqlObject.type;
    const typeConstructorName = type.constructor.name;
    const ofType = type.ofType;
    const ofTypeConstructorName = ofType ? ofType.constructor.name : '';

    if (this.isScalar(typeConstructorName)) {
      const defaultValue = basicTypesDefaultValues[type.name];
      return defaultValue === undefined ? null : defaultValue;
    }

    if (this.isScalar(ofTypeConstructorName)) {
      const defaultValue = basicTypesDefaultValues[ofType.name];
      if (this.isList(typeConstructorName)) {
        return [defaultValue === undefined ? null : defaultValue];
      }
      return defaultValue === undefined ? null : defaultValue;
    }

    if (this.isEnum(typeConstructorName)) {
      return type.getValues()[0].value;
    }

    if (this.isEnum(ofTypeConstructorName)) {
      if (this.isList(typeConstructorName)) {
        return [ofType.getValues()[0].value];
      }
      return ofType.getValues()[0].value;
    }

    if (this.isObjectType(ofTypeConstructorName) || this.isObjectType(typeConstructorName)) {
      const fields = ofType ? ofType.getFields() : type.getFields();
      const fieldsInputObject = {};
      Object.keys(fields).forEach(fieldKey => (fieldsInputObject[fieldKey] = this.generateInputObject(fields[fieldKey])));
      if (this.isList(typeConstructorName)) {
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

    if (this.isScalar(typeConstructorName) || this.isScalar(ofTypeConstructorName)) {
      return '';
    }

    if (this.isObjectType(ofTypeConstructorName) || this.isObjectType(typeConstructorName)) {
      const fields = ofType ? ofType.getFields() : type.getFields();
      if (Object.keys(fields).includes('id')) {
        return '{ id }';
      }

      const scalarKey = Object.keys(fields).find((fieldKey) => {
        const fieldType = fields[fieldKey].type;
        const fieldTypeConstructorName = fieldType.constructor.name;
        const fieldOfType = fieldType.ofType;
        const fieldOfTypeConstructorName = fieldOfType ? fieldOfType.constructor.name : '';
        return this.isScalar(fieldTypeConstructorName) || this.isScalar(fieldOfTypeConstructorName);
      });
      if (scalarKey) {
        return `{ ${scalarKey} }`;
      }

      const complexFieldKey = Object.keys(fields).sort()[0];
      const complexField = fields[complexFieldKey];
      return `{ ${this.generateOutputObjectString(complexField)} }`;
    }

    if (this.isUnionType(typeConstructorName) || this.isUnionType(ofTypeConstructorName)) {
      const unionTypes = type.getTypes();
      const subSelectionStringArray = unionTypes.map(item => {
        const wrapperObject = { type: item };
        const itemSubSelectionString = this.getSubSelectionString(wrapperObject);
        const unionTypeName = item.name;
        return `... on ${unionTypeName} ${itemSubSelectionString}`;
      });
      return `{ ${subSelectionStringArray.join('\n')} }`;
    }

    return '';
  }

  generateOutputObjectString(graphqlObject) {
    const args = graphqlObject.args;
    const argsStringArray = args.map((item) => {
      const type = item.type;
      const typeConstructorName = type.constructor.name;
      const ofType = type.ofType;
      const ofTypeConstructorName = ofType ? ofType.constructor.name : '';

      const isBasicType = this.isScalar(typeConstructorName) || this.isScalar(ofTypeConstructorName);

      const valueObject = this.generateInputObject(item);
      const valueObjectString = isBasicType ? valueObject : JSON2_MOD.stringify(valueObject, null, '', true);
      return `${item.name}: ${valueObjectString}`;
    });
    let argsString = argsStringArray.join(',');
    if (argsString) {
      argsString = `(${argsString})`;
    }

    const subSelectionString = this.getSubSelectionString(graphqlObject);

    return `${graphqlObject.name} ${argsString} ${subSelectionString}`;
  }

  @autobind
  mutationPressed(mutationName) {
    const mutationFields = this.props.schema.getMutationType().getFields();
    const mutation = mutationFields[mutationName];
    const mutationArgs = mutation.args;

    const queryVariables = [];
    const inputs = mutationArgs.map((mutationArg, index) => {
      const type = mutationArg.type;
      const typeConstructorName = type.constructor.name;
      const ofType = type.ofType;
      const ofTypeConstructorName = ofType ? ofType.constructor.name : '';

      debugger;
      const isBasicType = this.isScalar(typeConstructorName) || this.isScalar(ofTypeConstructorName);
      const valueObject = this.generateInputObject(mutationArg);

      if (!isBasicType) {
        queryVariables.push({
          name: '$input_' + index,
          type: ofType ? ofType.name : type.name,
          value: valueObject
        });
      }

      const valueObjectString = isBasicType ? JSON.stringify(valueObject) : ('$input_' + index);
      return `${mutationArg.name}: ${valueObjectString}`;
    });
    let inputString = inputs.join(',');
    if (inputString) {
      inputString = `(${inputString})`;
    }

    let mutationInputString = queryVariables.map(item => (`${item.name}: ${item.type}!`)).join(',');
    if (mutationInputString) {
      mutationInputString = `(${mutationInputString})`;
    }

    const queryVariablesObject = queryVariables.reduce((previousValue, currentValue) => {
      previousValue[currentValue.name.slice(1)] = currentValue.value;
      return previousValue;
    }, {});

    const outputType = mutation.type;
    const outputOfType = outputType.ofType;
    const outputTypeConstructorName = outputType.constructor.name;
    const outputOfTypeConstructorName = outputOfType ? outputOfType.constructor.name : '';
    const isScalarOutputType = this.isScalar(outputTypeConstructorName) || this.isScalar(outputOfTypeConstructorName);
    let outputString = '';
    if (!isScalarOutputType) {
      const outputFields = outputType.getFields();
      const outputStrings = Object.keys(outputFields).map((fieldKey) => {
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
    const queryVariablesString = JSON.stringify(queryVariablesObject, null, '  ');

    this.setState({
      showMutationsPopup: false,
      mutationSearchText: '',
    });
    this.props.updateQueryVariablesResponse && this.props.updateQueryVariablesResponse(prettyQuery, queryVariablesString);
  }

  @autobind
  generateMutationPressed() {
    this.setState({
      showMutationsPopup: !this.state.showMutationsPopup
    });
  }

  renderMutations() {
    if (!this.state.showMutationsPopup) {
      return null;
    }

    const mutation = this.props.schema.getMutationType();
    const mutationFields = mutation.getFields();

    const mutationSearchInputStyle = this.state.mutationSearchInputFocused ? styles.searchInputFocused : null;
    const mutationSearchText = (this.state.mutationSearchText || '').toLowerCase();

    return (
      <div style={styles.popup}>
        <input
          onChange={event => this.setState({ mutationSearchText: event.target.value })}
          style={Object.assign({}, styles.searchInput, mutationSearchInputStyle)}
          type={'text'}
          placeholder={'Find mutation...'}
          onFocus={() => this.setState({ mutationSearchInputFocused: true })}
          onBlur={() => this.setState({ mutationSearchInputFocused: false })}
          autoFocus={true}
        />
        {Object.keys(mutationFields)
          .sort()
          .filter(value => value.toLowerCase().includes(mutationSearchText))
          .map(mutationName => (
            <div
              key={mutationName}
              className={'menuListButton'}
              style={styles.menuListButton}
              onClick={() => this.mutationPressed(mutationName)}
            >
              {mutationName}
            </div>
        ))}
      </div>
    );
  }

  render() {
    const showGenerateMutation = this.props.schema && this.props.schema.getMutationType();
    if (!showGenerateMutation) {
      return null;
    }

    return (
      <div style={styles.toolBarButtonWrapper}>
        {this.renderMutations()}
        <GraphiQL.ToolbarButton
          title={'Generate mutation query'}
          label={'Generate Mutation'}
          onClick={this.generateMutationPressed}
        />
      </div>
    );
  }
}

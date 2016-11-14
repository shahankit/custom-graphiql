import React, { Component } from 'react';
import GraphiQL from 'graphiql';
import './graphiql.css';
import { autobind } from 'core-decorators';
import fetch from 'isomorphic-fetch';
import {
  buildClientSchema,
  parse,
  print,
} from 'graphql';
import { Style } from 'radium';
import JSON2_mod from '../../helpers/json2-mod';
import introspectionQuery from './introspectionQuery';

const styles = {
  container: {
    height: '100%',
    margin: 0,
    width: '100%',
    overflow: 'hidden',
  },
  topBar: {
    width: '100%',
    paddingTop: '10px',
    paddingBottom: '10px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    flexDirection: 'row',
    paddingLeft: '100px',
    paddingRight: '100px',
  },
  urlInputWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    lineHeight: '25px',
    color: '#333',
    backgroundColor: '#fff',
    backgroundRepeat: 'noRepeat',
    backgroundPosition: 'right 8px center',
    border: '1px solid #ddd',
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    outline: 'none',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.075)',
  },
  urlInputLabel: {
    paddingRight: '12px',
    paddingLeft: '12px',
    fontSize: '16px',
    color: '#767676',
    whiteSpace: 'nowrap',
    borderRight: '1px solid #eee',
    fontFamily: 'Helvetica',
  },
  urlInput: {
    paddingLeft: 8,
    paddingRight: 8,
    width: '300px',
    minHeight: '30px',
    paddingTop: '0',
    paddingBottom: '0',
    fontSize: '15px',
    background: 'none',
    border: 0,
    boxShadow: 'none',
    outline: 'none'
  },
  fetchButton: {
    padding: '3px 16px',
    fontSize: '14px',
    lineHeight: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    color: '#333',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: '#eee',
    backgroundImage: 'linear-gradient(#fcfcfc, #eee)',
    border: '1px solid #d5d5d5',
    borderLeftWidth: 0,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    fontFamily: 'Helvetica',
  },
  toolBarButtonWrapper: {
    position: 'relative',
  },
  popup: {
    position: 'absolute',
    top: '100%',
    left: 0,   
    zIndex: 100,
    paddingTop: 5,
    paddingBottom: 5,
    marginTop: 2,
    marginLeft: 5,
    backgroundColor: '#fff',
    backgroundClip: 'padding-box',
    border: '1px solid rgba(0,0,0,0.15)',
    borderRadius: 4,
    boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
    maxHeight: 385,
    overflowY: 'auto',
  },
  button: {
    display: 'block',
    padding: '4px 10px 4px 15px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  classBased: {
    '.link-button:hover': {
      backgroundColor: '#4078c0',
      color: 'white',
    },
    '.link-button': {
      color: '#333',
    },
    '.urlInputWrapper:focus': {
      borderColor: '#51a7e8 !important',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.075),0 0 5px rgba(81,167,232,0.5) !important',
    },
    '.fetchButton:hover': {
      textDecoration: 'none',
      backgroundColor: '#ddd !important',
      backgroundImage: 'linear-gradient(#eee, #ddd) !important',
      borderColor: '#ccc !important',
    }
  },
}

const basicTypesDefaultValues = {
  Float: 0.0,
  ID: '',
  Int: 0,
  String: '',
  Boolean: false,
};

export default class CustomGraphiQL extends Component {
  constructor() {
    super();

    this.state = {
      query: '',
      showMutationsPopup: false,
      variables: 'null',
      schema: null,
      graphQLEndpoint: '',
    };
  }

  isScalar(x) {
    return x === 'GraphQLScalarType';
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

  generateInputObject(graphqlObject) {
    const type = graphqlObject.type;
    const typeConstructorName = type.constructor.name;
    const ofType = type.ofType;
    const ofTypeConstructorName = !!ofType ? ofType.constructor.name : '';

    if (this.isScalar(typeConstructorName)) {
      return basicTypesDefaultValues[type.name];
    }

    if (this.isScalar(ofTypeConstructorName)) {
      if (this.isList(typeConstructorName)) {
        return [basicTypesDefaultValues[ofType.name]];
      }
      return basicTypesDefaultValues[ofType.name];
    }

    if (this.isObjectType(ofTypeConstructorName) || this.isObjectType(typeConstructorName)) {
      const fields = !!ofType ? ofType.getFields() : type.getFields();
      const fieldsInputObject = {};
      Object.keys(fields).forEach(fieldKey => fieldsInputObject[fieldKey] = this.generateInputObject(fields[fieldKey]));
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
    const ofTypeConstructorName = !!ofType ? ofType.constructor.name : '';

    if (this.isScalar(typeConstructorName) || this.isScalar(ofTypeConstructorName)) {
      return '';
    }

    if (this.isObjectType(ofTypeConstructorName) || this.isObjectType(typeConstructorName)) {
      const fields = !!ofType ? ofType.getFields() : type.getFields();
      if (Object.keys(fields).includes('id')) {
        return '{ id }';
      }

      const scalarKey = Object.keys(fields).find(fieldKey => {
        const fieldType = fields[fieldKey].type;
        const fieldTypeConstructorName = fieldType.constructor.name;
        const fieldOfType = fieldType.ofType;
        const fieldOfTypeConstructorName = !!fieldOfType ? fieldOfType.constructor.name : '';
        return this.isScalar(fieldTypeConstructorName) || this.isScalar(fieldOfTypeConstructorName);
      });
      if (scalarKey) {
        return `{ ${scalarKey} }`;
      }

      const complexFieldKey = Object.keys(fields).sort()[0];
      const complexField = fields[complexFieldKey];
      return `{ ${this.generateOutputObjectString(complexField)} }`;
    }

    return '';
  }

  generateOutputObjectString(graphqlObject) {
    const args = graphqlObject.args;
    const argsStringArray = args.map(item => {
      const type = item.type;
      const typeConstructorName = type.constructor.name;
      const ofType = type.ofType;
      const ofTypeConstructorName = !!ofType ? ofType.constructor.name : '';
      
      const isBasicType = this.isScalar(typeConstructorName) || this.isScalar(ofTypeConstructorName);

      const valueObject = this.generateInputObject(item);
      const valueObjectString = isBasicType ? valueObject : JSON2_mod.stringify(valueObject, null, '', true);
      return `${item.name}: ${valueObjectString}`
    });
    let argsString = argsStringArray.join(',');
    if (!!argsString) {
      argsString = `(${argsString})`;
    }

    const subSelectionString = this.getSubSelectionString(graphqlObject);

    return `${graphqlObject.name} ${argsString} ${subSelectionString}`;
  }

  @autobind
  async onFetchButtonPressed() {
    try {
      const url = this.inputRef.value;
      const graphQLParams = { query: introspectionQuery };
      const response = await fetch(url, {
        method: 'post',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphQLParams)
      });
      const result = await response.json();
      const schema = buildClientSchema(result.data);
      console.log('schema is', schema);
      this.setState({
        schema: schema,
        graphQLEndpoint: url
      });
    } catch(error) {

    }
  }

  @autobind
  mutationPressed(mutationName) {
    const mutationFields = this.state.schema.getMutationType().getFields();
    const mutation = mutationFields[mutationName];
    const mutationArgs = mutation.args;

    const queryVariables = [];

    const inputs = mutationArgs.map((mutationArg, index) => {
      const type = mutationArg.type;
      const typeConstructorName = type.constructor.name;
      const ofType = type.ofType;
      const ofTypeConstructorName = !!ofType ? ofType.constructor.name : '';

      const isBasicType = this.isScalar(typeConstructorName) || this.isScalar(ofTypeConstructorName);

      const valueObject = this.generateInputObject(mutationArg);

      if (!isBasicType) {
        queryVariables.push({
          name: '$input_' + index,
          type: !!ofType ? ofType.name : type.name,
          value: valueObject
        });
      }

      const valueObjectString = isBasicType ? valueObject : ('$input_' + index);
      return `${mutationArg.name}: ${valueObjectString}`;
    });
    let inputString = inputs.join(',');
    if (!!inputString) {
      inputString = `(${inputString})`;
    }

    let mutationInputString = queryVariables.map(item => (`${item.name}: ${item.type}!`)).join(',');
    if (!!mutationInputString) {
      mutationInputString = `(${mutationInputString})`;
    }

    const queryVariablesObject = queryVariables.reduce((previousValue, currentValue) => {
      previousValue[currentValue.name.slice(1)] = currentValue.value;
      return previousValue;
    }, {});

    const outputFields = mutation.type.getFields();
    const outputStrings = Object.keys(outputFields).map((fieldKey, index) => {
      const outputField = outputFields[fieldKey];
      return `${this.generateOutputObjectString(outputField)}`;
    });
    const outputString = outputStrings.join(',');

    const queryString = `
      mutation ${mutationName}Mutation${mutationInputString} {
        ${mutationName}${inputString} {
          ${outputString}
        }
      }
    `;
    const prettyQuery = print(parse(queryString))
    const queryVariablesString = JSON.stringify(queryVariablesObject, null, '  ');

    this.setState({
      showMutationsPopup: false,
      query: prettyQuery,
      variables: queryVariablesString
    });
  }

  @autobind
  generateMutationPressed() {
    this.setState({
      showMutationsPopup: !this.state.showMutationsPopup
    });
  }

  @autobind
  async graphQLFetcher(graphQLParams) {
    const graphQLEndpoint = this.state.graphQLEndpoint;
    const response = await fetch(graphQLEndpoint, {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphQLParams),
      credentials: 'include',
    });
    const result = await response.json();
    return result;
  }

  renderMutations() {
    if (!this.state.showMutationsPopup) {
      return null;
    }

    const mutation = this.state.schema.getMutationType();
    const mutationFields = mutation.getFields();

    return (
      <div style={styles.popup}>
        {Object.keys(mutationFields).sort().map(mutationName => (
          <div
            key={mutationName}
            className={'link-button'}
            style={styles.button}
            onClick={() => this.mutationPressed(mutationName)}
          >
            {mutationName}
          </div>
        ))}
      </div>
    );
  }

  render() {
    const showGenerateMutation = !!this.state.schema && !!this.state.schema.getMutationType();
    return (
      <div style={styles.container}>
        <div style={styles.topBar}>
          <form>
            <label
              ref={component => !!component && (this.labelRef = component)}
              className={'urlInputWrapper'}
              style={styles.urlInputWrapper}
              tabIndex={-1}
            >
              <div style={styles.urlInputLabel}>GraphQL Endpoint</div>
              <input
                ref={component => !!component && (this.inputRef = component)}
                style={styles.urlInput}
                type={'text'}
                placeholder={'http://localhost:8080/graphql'}
                onFocus={this.inputFocused}
                onBlur={this.inputBlurred}
              />
            </label>
          </form>
          <div
            className={'fetchButton'}
            style={styles.fetchButton}
            onClick={this.onFetchButtonPressed}
          >
            Fetch
          </div>
        </div>
        <GraphiQL
          query={this.state.query}
          variables={this.state.variables}
          schema={this.state.schema}
          fetcher={this.graphQLFetcher}
        >
          <GraphiQL.Toolbar>
            {(() => {
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
            })()}
          </GraphiQL.Toolbar>
        </GraphiQL>
        <Style rules={styles.classBased} />
      </div>
    );
  }
}

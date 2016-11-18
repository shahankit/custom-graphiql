import React, { Component } from 'react';
import GraphiQL from 'graphiql';
import Radium, { Style } from 'radium';
import { autobind } from 'core-decorators';
import fetch from 'isomorphic-fetch';
import {
  buildClientSchema,
  parse,
  print,
} from 'graphql';
import CopyToClipboard from 'react-copy-to-clipboard';
import './graphiql.css';
import JSON2_MOD from '../../helpers/json2-mod';
import introspectionQuery from './introspectionQuery';
import { getParameterByName } from '../../helpers/utility';

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
    height: '53px',
    boxSizing: 'border-box',
  },
  queryStringInputButtons: {
    display: 'flex',
    flexDirection: 'row',
    margin: '0px 8px 8px 8px',
  },
  toolBarButtons: {
    display: 'flex',
    flexDirection: 'row',
  },
  urlInputWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    lineHeight: '25px',
    color: '#767676',
    backgroundColor: '#fff',
    backgroundRepeat: 'noRepeat',
    backgroundPosition: 'right 8px center',
    borderStyle: 'solid',
    borderColor: '#ddd',
    borderWidth: '1px',
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    outline: 'none',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.075)',
  },
  urlInputWrapperFocused: {
    borderColor: '#51a7e8',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.075),0 0 5px rgba(81,167,232,0.5)',
    color: '#4078c0',
    backgroundColor: '#edf2f9',
  },
  urlInputWrapperError: {
    color: '#b00',
    backgroundImage: 'linear-gradient(#fdf3f3, #e6d6d7)',
    borderColor: 'rgba(187, 0, 0, 0.4)',
  },
  urlInputLabel: {
    paddingRight: '12px',
    paddingLeft: '12px',
    fontSize: '16px',
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
    border: 0,
    boxShadow: 'none',
    outline: 'none',
    backgroundColor: 'white',
  },
  shadowButton: {
    padding: '3px 16px',
    fontSize: '14px',
    lineHeight: '20px',
    height: '32px',
    boxSizing: 'border-box',
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
    borderStyle: 'solid',
    borderColor: '#d5d5d5',
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    fontFamily: 'Helvetica',
  },
  copiedButtonStyle: {
    color: '#55b230',
  },
  fetchButton: {
    borderLeftWidth: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  copyButton: {
    minWidth: '70px',
  },
  setButton: {
    marginLeft: '8px',
    minWidth: '70px',
  },
  queryStringInput: {
    margin: '8px',
    padding: '0px 8px',
    width: '300px',
    minHeight: '30px',
    fontSize: '15px',
    backgroundColor: 'white',
    color: '#333',
    verticalAlign: 'middle',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#ddd',
    borderRadius: '5px',
    outline: 'none',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.075)',
  },
  queryStringInputFocused: {
    borderColor: '#51a7e8',
    outline: 'none',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.075),0 0 5px rgba(81,167,232,0.5)',
  },
  searchInput: {
    margin: '8px',
    padding: '0px 8px',
    width: '250px',
    minHeight: '28px',
    fontSize: '14px',
    backgroundColor: 'white',
    color: '#333',
    verticalAlign: 'middle',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#ddd',
    borderRadius: '5px',
    outline: 'none',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.075)',
    fontFamily: 'Helvetica',
  },
  searchInputFocused: {
    borderColor: '#51a7e8',
    outline: 'none',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.075),0 0 5px rgba(81,167,232,0.5)',
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
    backgroundColor: '#f8f8f8',
    backgroundClip: 'padding-box',
    border: '1px solid rgba(0,0,0,0.15)',
    borderRadius: 4,
    boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
    maxHeight: 385,
    overflowY: 'auto',
  },
  button: {
    display: 'block',
    padding: '8px 8px 8px 30px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'Helvetica',
    borderBottom: '1px solid #eee',
  },
  savedQueriesText: {
    color: '#767676',
    fontSize: '16px',
  },
  saveQueryButton: {
    padding: '8px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'border-box',
    cursor: 'pointer',
  },
  crossButton: {
    display: 'block',
    float: 'right',
    fill: '#ccc',
    cursor: 'pointer',
  },
  classBased: {
    '.link-button:hover': {
      backgroundColor: '#4078c0',
      color: 'white',
    },
    '.link-button': {
      color: '#666',
      backgroundColor: 'white',
    },
    '.shadowButton:hover': {
      textDecoration: 'none',
      backgroundColor: '#ddd !important',
      backgroundImage: 'linear-gradient(#eee, #ddd) !important',
      borderColor: '#ccc !important',
    },
    '.saveQueryButton:hover': {
      backgroundColor: '#4078c0 !important',
      color: 'white !important',
    },
    '.crossButton:hover': {
      fill: 'white !important',
    },
  },
};

const basicTypesDefaultValues = {
  Float: 0.0,
  ID: '',
  Int: 0,
  String: '',
  Boolean: false,
};

@Radium
export default class CustomGraphiQL extends Component {
  constructor() {
    super();

    this.state = {
      query: '',
      showMutationsPopup: false,
      variables: 'null',
      schema: null,
      graphQLEndpoint: '',
      urlError: false,
      schemaFetchError: '',
      showQueryStringPopup: false,
      showCopied: false,
      mutationSearchText: '',
      savedQueriesSearchText: '',
    };
  }

  componentDidMount() {
    const currentURL = window.localStorage.getItem('currentURL');
    if (!currentURL) {
      return;
    }
    // eslint-disable-next-line react/no-direct-mutation-state
    this.state.graphQLEndpoint = currentURL;
    const currentURLQuery = window.localStorage.getItem(`${currentURL}:query`);
    const currentURLVariables = window.localStorage.getItem(`${currentURL}:variables`);
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({
      query: currentURLQuery || '',
      variables: currentURLVariables || '',
    });
    this.inputRef && (this.inputRef.value = currentURL);
    this.fetchGraphQLSchema(currentURL);
  }

  @autobind
  onInputKeyPress(event) {
    if (event.which === 13) {
      this.inputRef && this.inputRef.blur();
      this.onFetchButtonPressed();
      event.preventDefault();
      return false;
    }

    return true;
  }

  @autobind
  onFetchButtonPressed() {
    const url = this.inputRef && this.inputRef.value;
    this.fetchGraphQLSchema(url);
  }

  @autobind
  onEditQuery(queryString) {
    this.state.query = queryString;
    const currentURL = this.state.graphQLEndpoint;
    if (!currentURL) {
      return;
    }

    window.localStorage.setItem(`${currentURL}:query`, queryString);
  }

  @autobind
  onEditVariables(variables) {
    this.state.variables = variables;
    const currentURL = this.state.graphQLEndpoint;
    if (!currentURL) {
      return;
    }

    window.localStorage.setItem(`${currentURL}:variables`, variables);
  }

  @autobind
  onSetButtonPressed() {
    const queryStringInput = this.queryStringInputRef.value;
    this.setQueryFromString(queryStringInput);
    this.setState({
      showQueryStringPopup: false,
    });
  }

  setQueryFromString(queryStringInput) {
    const queryString = getParameterByName('query', queryStringInput);
    const variablesString = getParameterByName('variables', queryStringInput);
    const url = new URL(queryStringInput);
    const graphQLEndpoint = url.origin + url.pathname;
    if (graphQLEndpoint !== this.state.graphQLEndpoint) {
      this.fetchGraphQLSchema(graphQLEndpoint);
      this.inputRef.value = graphQLEndpoint;
    }

    window.localStorage.setItem(`${graphQLEndpoint}:query`, queryString);
    window.localStorage.setItem(`${graphQLEndpoint}:variables`, variablesString);

    this.setState({
      query: queryString,
      variables: variablesString,
      graphQLEndpoint,
    });
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

    return '';
  }

  @autobind
  getSetQueryPressed() {
    this.setState({
      showQueryStringPopup: !this.state.showQueryStringPopup
    });
  }

  @autobind
  saveLoadQueryPressed() {
    this.setState({
      showSavedQueriesPopup: !this.state.showSavedQueriesPopup
    });
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

  @autobind
  loadSavedQueryPressed(queryString) {
    this.setQueryFromString(queryString);
    this.setState({
      showSavedQueriesPopup: false
    });
  }

  @autobind
  handleClipBoardCopied() {
    this.setState({
      showCopied: true
    });
    this.copyTimeout = setTimeout(() => {
      this.setState({
        showCopied: false
      });
    }, 2000);
  }

  generateInputObject(graphqlObject) {
    const type = graphqlObject.type;
    const typeConstructorName = type.constructor.name;
    const ofType = type.ofType;
    const ofTypeConstructorName = ofType ? ofType.constructor.name : '';

    if (this.isScalar(typeConstructorName)) {
      return basicTypesDefaultValues[type.name];
    }

    if (this.isScalar(ofTypeConstructorName)) {
      if (this.isList(typeConstructorName)) {
        return [basicTypesDefaultValues[ofType.name]];
      }
      return basicTypesDefaultValues[ofType.name];
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

  async fetchGraphQLSchema(url) {
    try {
      const graphQLParams = { query: introspectionQuery };
      const response = await fetch(url, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphQLParams)
      });
      const result = await response.json();
      const schema = buildClientSchema(result.data);
      // eslint-disable-next-line no-console
      console.log('schema is', schema);
      window.localStorage.setItem('currentURL', url);
      this.setState({
        schema,
        graphQLEndpoint: url,
        urlError: false,
        schemaFetchError: '',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('error in fetching GraphQL schema', error);
      this.setState({
        urlError: true,
        schemaFetchError: error.toString()
      });
    }
  }

  @autobind
  removeQueryPressed(event, queryName) {
    event.stopPropagation();
    const currentURL = this.state.graphQLEndpoint;
    const currentURLQueriesString = window.localStorage.getItem(`${currentURL}:queries`) || '{}';
    const savedQueries = JSON.parse(currentURLQueriesString);
    delete savedQueries[queryName];
    const savedQueriesString = JSON.stringify(savedQueries);
    window.localStorage.setItem(`${currentURL}:queries`, savedQueriesString);
    this.setState({});
  }

  @autobind
  saveQueryPressed(queryName) {
    const currentURL = this.state.graphQLEndpoint;
    const currentURLQueriesString = window.localStorage.getItem(`${currentURL}:queries`) || '{}';
    const savedQueries = JSON.parse(currentURLQueriesString);
    const encodedQuery = encodeURIComponent(this.state.query);
    const encodedVariables = encodeURIComponent(this.state.variables);
    savedQueries[queryName.replace(' ', '-')] = `${currentURL}?query=${encodedQuery}&variables=${encodedVariables}`;
    const savedQueriesString = JSON.stringify(savedQueries);
    window.localStorage.setItem(`${currentURL}:queries`, savedQueriesString);
    this.setState({
      showSavedQueriesPopup: false,
      savedQueriesSearchText: '',
    });
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
      const ofTypeConstructorName = ofType ? ofType.constructor.name : '';

      const isBasicType = this.isScalar(typeConstructorName) || this.isScalar(ofTypeConstructorName);

      const valueObject = this.generateInputObject(mutationArg);

      if (!isBasicType) {
        queryVariables.push({
          name: '$input_' + index,
          type: ofType ? ofType.name : type.name,
          value: valueObject
        });
      }

      const valueObjectString = isBasicType ? valueObject : ('$input_' + index);
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

    const outputFields = mutation.type.getFields();
    const outputStrings = Object.keys(outputFields).map((fieldKey) => {
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
    const prettyQuery = print(parse(queryString));
    const queryVariablesString = JSON.stringify(queryVariablesObject, null, '  ');

    const currentURL = this.state.graphQLEndpoint;
    if (currentURL) {
      window.localStorage.setItem(`${currentURL}:query`, prettyQuery);
      window.localStorage.setItem(`${currentURL}:variables`, queryVariablesString);
    }
    this.setState({
      showMutationsPopup: false,
      mutationSearchText: '',
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
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphQLParams),
      credentials: 'include',
    });
    const result = await response.json();
    return result;
  }

  @autobind
  renderSavedQueriesPopup() {
    if (!this.state.showSavedQueriesPopup) {
      return null;
    }

    let savedQueries = {};
    const currentURL = this.state.graphQLEndpoint;
    if (currentURL) {
      const currentURLQueriesString = window.localStorage.getItem(`${currentURL}:queries`) || '{}';
      savedQueries = JSON.parse(currentURLQueriesString);
    }
    // const totalSavedQueries = Object.keys(savedQueries).length;

    const querySearchText = this.state.savedQueriesSearchText;
    const searchInputStyle = this.state.savedQueriesSearchInputFocused ? styles.searchInputFocused : null;
    return (
      <div style={styles.popup}>
        <input
          onChange={event => this.setState({ savedQueriesSearchText: event.target.value })}
          style={[styles.searchInput, searchInputStyle]}
          type={'text'}
          placeholder={'Find or save query...'}
          onFocus={() => this.setState({ savedQueriesSearchInputFocused: true })}
          onBlur={() => this.setState({ savedQueriesSearchInputFocused: false })}
        />
        {Object.keys(savedQueries)
          .sort()
          .filter(value => value.toLowerCase().includes(querySearchText))
          .map(queryName => (
            <div
              key={queryName}
              className={'link-button'}
              style={styles.button}
              onClick={() => this.loadSavedQueryPressed(savedQueries[queryName])}
            >
              {queryName}
              <div
                style={styles.crossButton}
                className={'crossButton'}
                onClick={event => this.removeQueryPressed(event, queryName)}
              >
                <svg
                  height="16"
                  role="img"
                  version="1.1"
                  viewBox="0 0 12 16"
                  width="12"
                >
                  <path fillRule="evenodd" d="M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48z" />
                </svg>
              </div>
            </div>
        ))}
        {(() => {
          const hasSavedQuery = Object.keys(savedQueries).find(item => (querySearchText.toLowerCase() === item.toLowerCase()));
          if (querySearchText.length > 0 && !hasSavedQuery) {
            return (
              <div
                className={'saveQueryButton'}
                style={styles.saveQueryButton}
                onClick={() => this.saveQueryPressed(querySearchText)}
              >
                Save query: {querySearchText}
              </div>
            );
          }

          return null;
        })()}
      </div>
    );
  }

  renderQueryStringInput() {
    if (!this.state.showQueryStringPopup) {
      return null;
    }

    const currentURL = this.state.graphQLEndpoint;
    let queryString = '';
    if (currentURL) {
      const encodedQuery = encodeURIComponent(this.state.query);
      const encodedVariables = encodeURIComponent(this.state.variables);
      queryString = `${currentURL}?query=${encodedQuery}&variables=${encodedVariables}`;
    }

    const queryStringInputStyle = this.state.queryStringInputFocused ? styles.queryStringInputFocused : null;
    const copiedButtonStyle = this.state.showCopied ? styles.copiedButtonStyle : null;

    return (
      <div style={styles.popup}>
        <input
          ref={component => component && (this.queryStringInputRef = component)}
          style={[styles.queryStringInput, queryStringInputStyle]}
          type={'text'}
          placeholder={'http://localhost:8080/graphql?query={}&variables={}'}
          defaultValue={queryString}
          onFocus={() => this.setState({ queryStringInputFocused: true })}
          onBlur={() => this.setState({ queryStringInputFocused: false })}
          onKeyPress={this.onQueryStringInputKeyPress}
        />
        <div style={styles.queryStringInputButtons}>
          <CopyToClipboard
            text={queryString}
            onCopy={this.handleClipBoardCopied}
          >
            <div
              className={'shadowButton'}
              style={[styles.shadowButton, copiedButtonStyle]}
              onClick={this.onCopyButtonPressed}
            >
              {this.state.showCopied ? 'Copied' : 'Copy'}
            </div>
          </CopyToClipboard>
          <div
            className={'shadowButton'}
            style={[styles.shadowButton, styles.setButton]}
            onClick={this.onSetButtonPressed}
          >
            Set
          </div>
        </div>
      </div>
    );
  }

  renderMutations() {
    if (!this.state.showMutationsPopup) {
      return null;
    }

    const mutation = this.state.schema.getMutationType();
    const mutationFields = mutation.getFields();

    const mutationSearchInputStyle = this.state.mutationSearchInputFocused ? styles.searchInputFocused : null;
    const mutationSearchText = (this.state.mutationSearchText || '').toLowerCase();

    return (
      <div style={styles.popup}>
        <input
          onChange={event => this.setState({ mutationSearchText: event.target.value })}
          style={[styles.searchInput, mutationSearchInputStyle]}
          type={'text'}
          placeholder={'Find mutation...'}
          onFocus={() => this.setState({ mutationSearchInputFocused: true })}
          onBlur={() => this.setState({ mutationSearchInputFocused: false })}
        />
        {Object.keys(mutationFields)
          .sort()
          .filter(value => value.toLowerCase().includes(mutationSearchText))
          .map(mutationName => (
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
    const showGenerateMutation = this.state.schema && this.state.schema.getMutationType();
    const inputWrapperStyle = this.state.inputFocused ? styles.urlInputWrapperFocused : (this.state.urlError ? styles.urlInputWrapperError : null);
    return (
      <div style={styles.container}>
        <div style={styles.topBar}>
          <form>
            <div
              style={[styles.urlInputWrapper, inputWrapperStyle]}
              tabIndex={-1}
            >
              <div style={styles.urlInputLabel}>GraphQL Endpoint</div>
              <input
                ref={component => component && (this.inputRef = component)}
                style={styles.urlInput}
                type={'text'}
                placeholder={'http://localhost:8080/graphql'}
                onFocus={() => this.setState({ inputFocused: true, urlError: false })}
                onBlur={() => this.setState({ inputFocused: false })}
                onKeyPress={this.onInputKeyPress}
              />
            </div>
          </form>
          <div
            className={'shadowButton'}
            style={[styles.shadowButton, styles.fetchButton]}
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
          onEditQuery={this.onEditQuery}
          onEditVariables={this.onEditVariables}
        >
          <GraphiQL.Toolbar>
            <div style={styles.toolBarButtons}>
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
              <div style={styles.toolBarButtonWrapper}>
                {this.renderQueryStringInput()}
                <GraphiQL.ToolbarButton
                  title={'URL with query and variables as query-params'}
                  label={'Get or Set query'}
                  onClick={this.getSetQueryPressed}
                />
              </div>
              <div style={styles.toolBarButtonWrapper}>
                {this.renderSavedQueriesPopup()}
                <GraphiQL.ToolbarButton
                  title={'Save or Load query'}
                  label={'Save / Load'}
                  onClick={this.saveLoadQueryPressed}
                />
              </div>
            </div>
          </GraphiQL.Toolbar>
        </GraphiQL>
        <Style rules={styles.classBased} />
      </div>
    );
  }
}

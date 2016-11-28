import React, {
  Component,
  PropTypes
} from 'react';
import {
  buildClientSchema,
  parse,
  print,
  introspectionQuery,
  GraphQLSchema
} from 'graphql';
import fetch from 'isomorphic-fetch';
import GraphiQL from 'graphiql';
import { autobind } from 'core-decorators';
import styles from './styles.js';
import { getParameterByName } from  '../helpers/getParameters';
import TopBar from './TopBar';
import GenerateMutation from './GenerateMutation';
import GetSetQuery from './GetSetQuery';
import SaveLoadQuery from './SaveLoadQuery';
import EditHeaderModal from './EditHeaderModal';

export default class CustomGraphiQL extends Component {
  static propTypes = {
    fetcher: PropTypes.func,
    schema: PropTypes.instanceOf(GraphQLSchema),
    query: PropTypes.string,
    variables: PropTypes.string,
    operationName: PropTypes.string,
    response: PropTypes.string,
    storage: PropTypes.shape({
      getItem: PropTypes.func,
      setItem: PropTypes.func
    }),
    defaultQuery: PropTypes.string,
    onEditQuery: PropTypes.func,
    onEditVariables: PropTypes.func,
    onEditOperationName: PropTypes.func,
    onToggleDocs: PropTypes.func,
    getDefaultFieldNames: PropTypes.func
  };

  constructor(props) {
    super(props);

    // Cache the storage instance
    this.storage = props.storage || window.localStorage;

    const currentURL = this.storageGet('currentURL');

    // Determine the initial query to display.
    const query = props.query || this.storageGet(`${currentURL}:query`) || undefined;

    // Determine the initial variables to display.
    const variables = props.variables || this.storageGet(`${currentURL}:variables`);

    const headers = this.storageGet('headers') ? JSON.parse(this.storageGet('headers')) : {};

    // Initialize state
    this.state = {
      schema: props.schema || null,
      query,
      variables,
      response: props.response,
      graphQLEndpoint: currentURL,
      schemaFetchError: '',
      headers,
    };
  }

  componentDidMount() {
    const currentURL = this.state.graphQLEndpoint;
    if (!currentURL) {
      return;
    }
    this.fetchGraphQLSchema(currentURL);
  }

  @autobind
  storageGet(name) {
    return this.storage && this.storage.getItem('cgraphiql:' + name);
  }

  @autobind
  storageSet(name, value) {
    this.storage && this.storage.setItem('cgraphiql:' + name, value);
  }

  @autobind
  getCurrentResponse() {
    return this.state.response;
  }

  @autobind
  setSavedQueries(savedQueriesString) {
    const currentURL = this.state.graphQLEndpoint;
    this.storageSet(`${currentURL}:queries`, savedQueriesString);
  }

  @autobind
  getSavedQueries() {
    const currentURL = this.state.graphQLEndpoint;
    const currentURLQueriesString = this.storageGet(`${currentURL}:queries`) || '{}';
    return JSON.parse(currentURLQueriesString);
  }

  @autobind
  setQueryFromString(queryStringInput) {
    if (!queryStringInput) {
      this.updateQueryVariablesResponse('', '');
      return;
    }

    const queryString = getParameterByName('query', queryStringInput) || '{}';
    const variablesString = getParameterByName('variables', queryStringInput) || 'null';
    const responseString = getParameterByName('response', queryStringInput) || this.state.response;
    const url = new URL(queryStringInput);
    const graphQLEndpoint = url.origin + url.pathname;
    if (graphQLEndpoint !== this.state.graphQLEndpoint) {
      this.fetchGraphQLSchema(graphQLEndpoint);
      this.state.graphQLEndpoint = graphQLEndpoint;
    }

    this.updateQueryVariablesResponse(queryString, variablesString, responseString);
  }

  @autobind
  updateQueryVariablesResponse(queryString, variablesString, responseString) {
    const currentURL = this.state.graphQLEndpoint;
    this.storageSet(`${currentURL}:query`, queryString);
    this.storageSet(`${currentURL}:variables`, variablesString);
    this.setState({
      query: queryString,
      variables: variablesString,
      response: responseString || this.state.response
    });
  }

  @autobind
  async fetchGraphQLSchema(url) {
    try {
      const headers = this.state.headers;
      const graphQLParams = { query: introspectionQuery };
      const response = await fetch(url, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(graphQLParams)
      });

      // GET method
      // const response = await fetch(`${url}?query=${encodeURIComponent(graphQLParams.query)}}&variables=${encodeURIComponent('{}')}`, { method: 'get' });
      
      const result = await response.json();
      if (result.errors) {
        throw new Error(JSON.stringify(result.errors));
      }
      const schema = buildClientSchema(result.data);
      this.storageSet('currentURL', url);
      this.setState({
        schema,
        graphQLEndpoint: url,
        schemaFetchError: '',
        response: 'Schema fetched',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in fetching GraphQL schema', error);
      this.setState({
        schemaFetchError: error.toString(),
        response: error.toString(),
      });
    }
  }

  @autobind
  async graphQLFetcher(graphQLParams) {
    try {
      const graphQLEndpoint = this.state.graphQLEndpoint;
      if (!graphQLEndpoint) {
        console.warn('Please set a GraphQL endpoint');
        return null;
      }
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
      this.state.response = JSON.stringify(result, null, 2);
      return result;
    } catch (error) {
      const result = {
        error: error.toString()
      };
      this.state.response = JSON.stringify(result, null, 2);
      return result;
    }
  }

  @autobind
  updateHeaders(newHeaders) {
    this.storageSet('headers', JSON.stringify(newHeaders));
    this.setState({
      headers: newHeaders,
      editHeaderModalVisible: false,
    });
  }

  @autobind
  hideEditHeaderModal() {
    this.setState({
      editHeaderModalVisible: false
    });
  }

  @autobind
  showEditHeaderModal() {
    this.setState({
      editHeaderModalVisible: true
    });
  }

  @autobind
  onEditQuery(queryString) {
    this.setState({
      query: queryString
    });
    this.props.onEditQuery && this.onEditQuery(queryString);
    const currentURL = this.state.graphQLEndpoint;
    if (!currentURL) {
      return;
    }

    this.storageSet(`${currentURL}:query`, queryString);
  }

  @autobind
  onEditVariables(variablesString) {
    this.setState({
      variables: variablesString
    });
    this.props.onEditVariables && this.onEditVariables(queryString);
    const currentURL = this.state.graphQLEndpoint;
    if (!currentURL) {
      return;
    }

    this.storageSet(`${currentURL}:variables`, variablesString);
  }

  render() {
    const children = React.Children.toArray(this.props.children);

    const logo = children.find(child => child.type === GraphiQL.Logo);
    
    const toolbar = children.find(child => child.type === GraphiQL.Toolbar);

    const footer = children.find(child => child.type === GraphiQL.Footer);

    return (
      <div style={styles.container}>
        <TopBar
          schemaFetchError={this.state.schemaFetchError}
          fetchGraphQLSchema={this.fetchGraphQLSchema}
          graphQLEndpoint={this.state.graphQLEndpoint}
          headers={this.state.headers}
          onEditHeadersButtonPressed={this.showEditHeaderModal}
        />
        <GraphiQL
          fetcher={this.graphQLFetcher}
          schema={this.state.schema}
          query={this.state.query}
          variables={this.state.variables}
          operationName={this.props.operationName}
          response={this.state.response}
          onEditQuery={this.onEditQuery}
          onEditVariables={this.onEditVariables}
          onEditOperationName={this.props.onEditOperationName}
          onToggleDocs={this.props.onToggleDocs}
          getDefaultFieldNames={this.props.getDefaultFieldNames}
        >
          <GraphiQL.Toolbar>
            <div style={styles.toolBarButtons}>
              <GenerateMutation
                schema={this.state.schema}
                updateQueryVariablesResponse={this.updateQueryVariablesResponse}
              />
              <GetSetQuery
                query={this.state.query}
                variables={this.state.variables}
                graphQLEndpoint={this.state.graphQLEndpoint}
                setQueryFromString={this.setQueryFromString}
              />
              <SaveLoadQuery
                query={this.state.query}
                variables={this.state.variables}
                graphQLEndpoint={this.state.graphQLEndpoint}
                getSavedQueries={this.getSavedQueries}
                setSavedQueries={this.setSavedQueries}
                setQueryFromString={this.setQueryFromString}
                getCurrentResponse={this.getCurrentResponse}
              />
              {toolbar}
            </div>
          </GraphiQL.Toolbar>
          {logo}
          {footer}
        </GraphiQL>
        {(() => {
          if (!this.state.editHeaderModalVisible) {
            return null;
          }

          return (
            <EditHeaderModal
              headers={this.state.headers}
              updateHeaders={this.updateHeaders}
              hideEditHeaderModal={this.hideEditHeaderModal}
            />
          );
        })()}
      </div>
    );
  }
}

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
import GraphiQL from 'graphiql';
import { autobind } from 'core-decorators';
import styles from './styles.js';
import '../css/graphiql.css';
import '../css/cgraphiql.css';
import { getParameterByName } from  '../helpers/getParameters';
import TopBar from './TopBar';
import GenerateMutation from './GenerateMutation';
import GetSetQuery from './GetSetQuery';
import SaveLoadQuery from './SaveLoadQuery';

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

    // Initialize state
    this.state = {
      schema: props.schema || null,
      query,
      variables,
      response: props.response,
      graphQLEndpoint: currentURL,
      schemaFetchError: ''
    };
  }

  componentDidMount() {
    const currentURL = this.state.graphQLEndpoint;
    if (!currentURL) {
      return;
    }
    this.fetchGraphQLSchema(currentURL);
  }

  storageGet(name) {
    return this.storage && this.storage.getItem('cgraphiql:' + name);
  }

  storageSet(name, value) {
    this.storage && this.storage.setItem('cgraphiql:' + name, value);
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
      this.updateQueryAndVariables('', '');
      return;
    }

    const queryString = getParameterByName('query', queryStringInput) || '{}';
    const variablesString = getParameterByName('variables', queryStringInput) || 'null';
    const url = new URL(queryStringInput);
    const graphQLEndpoint = url.origin + url.pathname;
    if (graphQLEndpoint !== this.state.graphQLEndpoint) {
      this.fetchGraphQLSchema(graphQLEndpoint);
      this.state.graphQLEndpoint = graphQLEndpoint;
    }

    this.updateQueryAndVariables(queryString, variablesString);
  }

  @autobind
  updateQueryAndVariables(queryString, variablesString) {
    const currentURL = this.state.graphQLEndpoint;
    this.storageSet(`${currentURL}:query`, queryString);
    this.storageSet(`${currentURL}:variables`, variablesString);
    this.setState({
      query: queryString,
      variables: variablesString
    });
  }

  @autobind
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
    return (
      <div style={styles.container}>
        <TopBar
          schemaFetchError={this.state.schemaFetchError}
          fetchGraphQLSchema={this.fetchGraphQLSchema}
          graphQLEndpoint={this.state.graphQLEndpoint}
        />
        <GraphiQL
          fetcher={this.props.fetcher || this.graphQLFetcher}
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
                updateQueryAndVariables={this.updateQueryAndVariables}
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
              />
            </div>
          </GraphiQL.Toolbar>
        </GraphiQL>
      </div>
    );
  }
}

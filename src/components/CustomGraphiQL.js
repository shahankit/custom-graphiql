import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { buildClientSchema, introspectionQuery, GraphQLSchema } from 'graphql';
import fetch from 'isomorphic-fetch';
import GraphiQL from 'graphiql';
import { getParameterByName } from '../helpers/getParameters';
import TopBar from './TopBar';
import GenerateMutation from './GenerateMutation';
import GetSetURL from './GetSetURL';
import EditHeaderModal from './EditHeaderModal';

export default class CustomGraphiQL extends Component {
  static propTypes = {
    schema: PropTypes.instanceOf(GraphQLSchema),
    query: PropTypes.string,
    currentURL: PropTypes.string,
    variables: PropTypes.string,
    operationName: PropTypes.string,
    response: PropTypes.string,
    storage: PropTypes.shape({
      getItem: PropTypes.func,
      setItem: PropTypes.func,
      removeItem: PropTypes.func,
    }),
    defaultQuery: PropTypes.string,
    onEditQuery: PropTypes.func,
    onEditVariables: PropTypes.func,
    onEditOperationName: PropTypes.func,
    onToggleDocs: PropTypes.func,
    getDefaultFieldNames: PropTypes.func,
    editorTheme: PropTypes.string,
    onToggleHistory: PropTypes.func,
    ResultsTooltip: PropTypes.any,
  };

  constructor(props) {
    super(props);

    // Cache the storage instance
    this.storage = props.storage || window.localStorage;

    // Determine the initial url.
    const currentURL = this.storageGet('currentURL') || props.currentURL;

    // Determine the initial query to display.
    const query = props.query;

    // Determine the initial variables to display.
    const variables = props.variables;

    const headers = this.storageGet('headers')
      ? JSON.parse(this.storageGet('headers'))
      : {};

    // Initialize state
    this.state = {
      schema: props.schema || null,
      query,
      variables,
      response: props.response,
      graphQLEndpoint: currentURL,
      schemaFetchError: '',
      headers,
      editHeaderModalVisible: false
    };
  }

  componentDidMount() {
    const currentURL = this.state.graphQLEndpoint;
    if (!currentURL) {
      return;
    }
    this.handleURLChange(currentURL);
  }

  storageGet = name => {
    if (this.storage) {
      return this.storage.getItem('cgraphiql:' + name);
    }
    return null;
  };

  storageSet = (name, value) => {
    if (this.storage) {
      this.storage.setItem('cgraphiql:' + name, value);
    }
  };

  getCurrentResponse = () => {
    return this.state.response;
  };

  setGraphiQLRef = ref => {
    this.graphiQL = ref;
  };

  handleUpdateGraphURL = graphURL => {
    if (!graphURL) {
      this.handleUpdateQueryVariablesResponse('', '');
      return;
    }

    const queryString = getParameterByName('query', graphURL) || '{}';
    const variablesString = getParameterByName('variables', graphURL) || 'null';
    const responseString =
      getParameterByName('response', graphURL) || this.state.response;
    const url = new URL(graphURL);
    const graphQLEndpoint = url.origin + url.pathname;
    if (graphQLEndpoint !== this.state.graphQLEndpoint) {
      this.handleURLChange(graphQLEndpoint);
      this.setState({ graphQLEndpoint });
    }

    this.handleUpdateQueryVariablesResponse(
      queryString,
      variablesString,
      responseString
    );
  };

  handlePrettifyQuery = () => {
    if (this.graphiQL) {
      this.graphiQL.handlePrettifyQuery();
    }
    this.handlePrettifyVariables();
  };

  handlePrettifyVariables = () => {
    if (!this.state.variables) {
      return;
    }
    const variables = this.state.variables || '{}';
    try {
      const formattedVariables = JSON.stringify(JSON.parse(variables), null, 2);
      this.setState({
        variables: formattedVariables
      });
    } catch (error) {
      this.setState({
        response: `Query Variables: Not a valid JSON\n${error}`
      });
    }
  };

  handleToggleHistory = () => {
    if (this.graphiQL) {
      this.graphiQL.handleToggleHistory();
    }
  };

  handleUpdateQueryVariablesResponse = (
    queryString,
    variablesString,
    responseString
  ) => {
    this.setState({
      query: queryString,
      variables: variablesString,
      response: responseString || this.state.response
    });
  };

  handleURLChange = url => {
    const headers = this.state.headers;
    const graphQLParams = { query: introspectionQuery };
    return fetch(url, {
      method: 'post',
      // credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(graphQLParams)
    })
      .then(response => response.json())
      .then(result => {
        if (result.errors) {
          throw new Error(JSON.stringify(result.errors));
        }
        const schema = buildClientSchema(result.data);
        this.storageSet('currentURL', url);
        this.setState({
          schema,
          graphQLEndpoint: url,
          schemaFetchError: '',
          response: 'Schema fetched'
        });
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Error in fetching GraphQL schema', error);
        this.setState({
          schemaFetchError: error.toString(),
          response: error.toString()
        });
      });
  };

  graphQLFetcher = graphQLParams => {
    const headers = this.state.headers;
    const graphQLEndpoint = this.state.graphQLEndpoint;
    if (!graphQLEndpoint) {
      // eslint-disable-next-line no-console
      console.warn('Please set a GraphQL endpoint');
      return null;
    }
    return fetch(graphQLEndpoint, {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(graphQLParams),
      credentials: 'include'
    })
      .then(response => response.json())
      .then(result => {
        this.setState({ response: JSON.stringify(result, null, 2) });
        return result;
      })
      .catch(error => {
        const result = {
          error: error.toString()
        };
        this.setState({ response: JSON.stringify(result, null, 2) });
        return result;
      });
  };

  handleHeadersUpdated = newHeaders => {
    this.storageSet('headers', JSON.stringify(newHeaders));
    this.setState({
      headers: newHeaders,
      editHeaderModalVisible: false
    });
  };

  handleToggleEditHeaders = () => {
    this.setState({
      editHeaderModalVisible: !this.state.editHeaderModalVisible
    });
  };

  handleEditQuery = queryString => {
    this.setState({
      query: queryString
    });
    if (this.props.onEditQuery) {
      this.onEditQuery(queryString);
    }
  };

  handleEditVariables = queryString => {
    if (this.props.onEditVariables) {
      this.props.onEditVariables(queryString);
    }
    this.setState({
      variables: queryString
    });
  };

  render() {
    const children = React.Children.toArray(this.props.children);

    const logo = children.find(child => child.type === GraphiQL.Logo);
    const footer = children.find(child => child.type === GraphiQL.Footer);

    return (
      <div className="cgraphiql-container">
        <TopBar
          schemaFetchError={this.state.schemaFetchError}
          onChangeURL={this.handleURLChange}
          graphQLEndpoint={this.state.graphQLEndpoint}
          headers={this.state.headers}
          onEditHeaders={this.handleToggleEditHeaders}
        />
        <GraphiQL
          ref={this.setGraphiQLRef}
          fetcher={this.graphQLFetcher}
          schema={this.state.schema}
          query={this.state.query}
          variables={this.state.variables}
          operationName={this.props.operationName}
          response={this.state.response}
          onEditQuery={this.handleEditQuery}
          onEditVariables={this.handleEditVariables}
          onEditOperationName={this.props.onEditOperationName}
          onToggleDocs={this.props.onToggleDocs}
          getDefaultFieldNames={this.props.getDefaultFieldNames}
          editorTheme={this.props.editorTheme}
          onToggleHistory={this.props.onToggleHistory}
          ResultsTooltip={this.props.ResultsTooltip}
        >
          <GraphiQL.Toolbar>
            <GraphiQL.Button
              onClick={this.handlePrettifyQuery}
              title="Prettify Query (Shift-Ctrl-P)"
              label="Prettify"
            />
            <GraphiQL.Button
              onClick={this.handleToggleHistory}
              title="Show History"
              label="History"
            />
            <GenerateMutation
              schema={this.state.schema}
              onUpdateQueryVariablesResponse={
                this.handleUpdateQueryVariablesResponse
              }
            />
            <GetSetURL
              query={this.state.query}
              variables={this.state.variables}
              graphQLEndpoint={this.state.graphQLEndpoint}
              onUpdateGraphURL={this.handleUpdateGraphURL}
            />
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
              onUpdateHeaders={this.handleHeadersUpdated}
              onEditHeadersCancel={this.handleToggleEditHeaders}
            />
          );
        })()}
      </div>
    );
  }
}

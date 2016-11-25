import React, { PropTypes, Component } from 'react';
import GraphiQL from 'graphiql';
import Radium, { Style } from 'radium';
import { autobind } from 'core-decorators';
import fetch from 'isomorphic-fetch';
import {
  buildClientSchema,
  parse,
  print,
  introspectionQuery
} from 'graphql';
import CopyToClipboard from 'react-copy-to-clipboard';
import '../../css/graphiql.css';
import JSON2_MOD from '../../helpers/json2-mod';
import { getParameterByName } from '../helpers/getParameters';

const styles = {
  
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

export class CustomGraphiQL extends Component {

  render() {
    const inputWrapperStyle = this.state.inputFocused ? styles.urlInputWrapperFocused : (this.state.urlError ? styles.urlInputWrapperError : null);
    return (
      <div style={styles.container}>
        <GraphiQL
          query={this.state.query}
          variables={this.state.variables}
          schema={this.state.schema}
          response={this.state.schemaFetchError || null}
          fetcher={this.graphQLFetcher}
          onEditQuery={this.onEditQuery}
          onEditVariables={this.onEditVariables}
        >
          <GraphiQL.Toolbar>
            <div style={styles.toolBarButtons}>
              <div style={styles.toolBarButtonWrapper}>
                {this.renderQueryStringInput()}
                <GraphiQL.ToolbarButton
                  title={'URL with query and variables as query-params'}
                  label={'Get or Set query'}
                  onClick={this.getSetQueryPressed}
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

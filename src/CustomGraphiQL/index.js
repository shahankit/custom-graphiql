import React, { Component } from 'react';
import GraphiQL from 'graphiql';
import './graphiql.css';
import { autobind } from 'core-decorators';
import { buildClientSchema } from 'graphql';
import { Style } from 'radium';

const styles = {
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
  },
}

export default class CustomGraphiQL extends Component {
  constructor() {
    super();

    this.state = {
      showMutationsPopup: false
    };
  }

  @autobind
  mutationPressed(mutationName) {
    this.setState({ showMutationsPopup: false });
  }

  @autobind
  generateMutationPressed() {
    this.setState({
      showMutationsPopup: !this.state.showMutationsPopup
    });
  }

  @autobind
  async graphQLFetcher(graphQLParams) {
    const graphQLEndpoint = 'http://lyearn.herokuapp.com/graphql';
    const response = await fetch(graphQLEndpoint, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphQLParams),
    });
    const result = await response.json();
    const schema = buildClientSchema(result.data);
    this.schema = schema;
    this.setState({});
    return result;
  }

  renderMutations() {
    if (!this.state.showMutationsPopup) {
      return null;
    }

    const mutation = this.schema.getMutationType();
    const mutationFields = mutation.getFields();

    return (
      <div style={styles.popup}>
        {Object.keys(mutationFields).sort().map(mutationName => (
          <div className={'link-button'} style={styles.button} onClick={() => this.mutationPressed(mutationName)}>{mutationName}</div>
        ))}
        <Style rules={styles.classBased} />
      </div>
    );
  }

  render() {
    const showGenerateMutation = !!this.schema && !!this.schema.getMutationType();
    return (
      <GraphiQL fetcher={this.graphQLFetcher}>
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
    );
  }
}

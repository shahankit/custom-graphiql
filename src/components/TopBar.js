import React, { Component } from 'react';
import styles from './styles.js';
import { autobind } from 'core-decorators';

export default class TopBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      inputFocused: false,
      schemaFetchError: props.schemaFetchError,
      inputValue: props.graphQLEndpoint,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.schemaFetchError !== nextProps.schemaFetchError) {
      this.state.schemaFetchError = nextProps.schemaFetchError;
    }
  }

  @autobind
  onInputKeyPress(event) {
    if (event.which === 13) {
      this.urlInputRef && this.urlInputRef.blur();
      this.onFetchButtonPressed();
      event.preventDefault();
      return false;
    }

    return true;
  }

  @autobind
  onFetchButtonPressed() {
    const url = this.state.inputValue;
    this.props.fetchGraphQLSchema && this.props.fetchGraphQLSchema(url);
  }

  render() {
    const inputWrapperStyle = this.state.inputFocused ? styles.urlInputWrapperFocused : (this.state.schemaFetchError ? styles.urlInputWrapperError : null);
    return (
      <div style={styles.topBar}>
        <form>
          <div
            style={{...styles.urlInputWrapper, ...inputWrapperStyle}}
            tabIndex={-1}
          >
            <div style={styles.urlInputLabel}>GraphQL Endpoint</div>
            <input
              ref={component => component && (this.urlInputRef = component)}
              style={styles.urlInput}
              type={'text'}
              value={this.state.inputValue || ''}
              onChange={(event) => this.setState({ inputValue: event.target.value })}
              placeholder={'http://localhost:8080/graphql'}
              onFocus={() => this.setState({ inputFocused: true, schemaFetchError: '' })}
              onBlur={() => this.setState({ inputFocused: false })}
              onKeyPress={this.onInputKeyPress}
            />
          </div>
        </form>
        <div
          className={'shadowButton'}
          style={{...styles.shadowButton, ...styles.fetchButton}}
          onClick={this.onFetchButtonPressed}
        >
          Fetch
        </div>
        <div
          className={'shadowButton'}
          style={{...styles.shadowButton, ...styles.editHeadersButton}}
          onClick={this.props.onEditHeadersButtonPressed}
        >
          Edit HTTP headers ({Object.keys(this.props.headers).length})
        </div>
      </div>
    );
  }
}

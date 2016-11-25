import React, { Component } from 'react';
import GraphiQL from 'graphiql';
import { autobind } from 'core-decorators';
import CopyToClipboard from 'react-copy-to-clipboard';
import styles from './styles';

export default class GetSetQuery extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showQueryStringPopup: false,
      queryStringInputFocused: false,
      showCopied: false,
    };
  }

  @autobind
  onQueryStringInputKeyPress(event) {
    if (event.which === 13) {
      this.queryStringInputRef && this.queryStringInputRef.blur();
      this.onSetButtonPressed();
      event.preventDefault();
      return false;
    }

    return true;
  }

  @autobind
  onSetButtonPressed() {
    const queryStringInput = this.queryStringInputRef.value;
    this.props.setQueryFromString && this.props.setQueryFromString(queryStringInput);
    this.setState({
      showQueryStringPopup: false,
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

  @autobind
  getSetQueryPressed() {
    this.setState({
      showQueryStringPopup: !this.state.showQueryStringPopup
    });
  }

  renderQueryStringInput() {
    if (!this.state.showQueryStringPopup) {
      return null;
    }

    const currentURL = this.props.graphQLEndpoint;
    let queryString = '';
    if (currentURL) {
      const encodedQuery = encodeURIComponent(this.props.query || '{}');
      const encodedVariables = encodeURIComponent(this.props.variables || '{}');
      queryString = `${currentURL}?query=${encodedQuery}&variables=${encodedVariables}`;
    }

    const queryStringInputStyle = this.state.queryStringInputFocused ? styles.queryStringInputFocused : null;
    const copiedButtonStyle = this.state.showCopied ? styles.copiedButton : null;

    return (
      <div style={styles.popup}>
        <input
          ref={component => component && (this.queryStringInputRef = component)}
          style={Object.assign({}, styles.queryStringInput, queryStringInputStyle)}
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
              style={Object.assign({}, styles.shadowButton, copiedButtonStyle)}
            >
              {this.state.showCopied ? 'Copied' : 'Copy'}
            </div>
          </CopyToClipboard>
          <div
            className={'shadowButton'}
            style={Object.assign({}, styles.shadowButton, styles.setButton)}
            onClick={this.onSetButtonPressed}
          >
            Set
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div style={styles.toolBarButtonWrapper}>
        {this.renderQueryStringInput()}
        <GraphiQL.ToolbarButton
          title={'URL with query and variables as query-params'}
          label={'Get or Set query'}
          onClick={this.getSetQueryPressed}
        />
      </div>
    );
  }
}

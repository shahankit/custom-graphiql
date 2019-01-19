import React, { Component } from 'react';
import PropTypes from 'prop-types';
import GraphiQL from 'graphiql';
import CopyToClipboard from 'react-copy-to-clipboard';

export default class GetSetURL extends Component {
  static propTypes = {
    graphQLEndpoint: PropTypes.string.isRequired,
    onUpdateGraphURL: PropTypes.func,
    query: PropTypes.string,
    variables: PropTypes.string
  };

  constructor(props) {
    super(props);

    this.state = {
      showURLListPopup: false,
      showCopied: false
    };
  }

  setGraphURLInputRef = ref => {
    this.graphURLInputRef = ref;
  };

  handleGraphURLInputKeyPress = event => {
    if (event.which === 13) {
      if (this.graphURLInputRef) {
        this.graphURLInputRef.blur();
      }
      this.onSetButtonPressed();
      event.preventDefault();
      return false;
    }

    return true;
  };

  handleUpdateGraphURL = () => {
    const graphURL = this.graphURLInputRef.value;
    if (this.props.onUpdateGraphURL) {
      this.props.onUpdateGraphURL(graphURL);
    }
    this.setState({
      showURLListPopup: false
    });
  };

  handleClipBoardCopied = () => {
    this.setState({
      showCopied: true
    });
    this.copyTimeout = setTimeout(() => {
      this.setState({
        showCopied: false
      });
    }, 2000);
  };

  handleToggleURLListPopup = () => {
    this.setState({
      showURLListPopup: !this.state.showURLListPopup
    });
  };

  renderGraphURLInput() {
    if (!this.state.showURLListPopup) {
      return null;
    }

    const currentURL = this.props.graphQLEndpoint;
    let graphURL = '';
    if (currentURL) {
      const encodedQuery = encodeURIComponent(this.props.query || '{}');
      const encodedVariables = encodeURIComponent(this.props.variables || '{}');
      graphURL = `${currentURL}?query=${encodedQuery}&variables=${encodedVariables}`;
    }

    const { showCopied } = this.state;

    return (
      <div className="menu-popup get-set-url-popup">
        <input
          ref={this.setGraphURLInputRef}
          className="input"
          type="text"
          placeholder={'http://localhost:8080/graphql?query={}&variables={}'}
          defaultValue={graphURL}
          onKeyPress={this.handleGraphURLInputKeyPress}
        />
        <div className="button-container">
          <CopyToClipboard text={graphURL} onCopy={this.handleClipBoardCopied}>
            <button
              className={`shadow-button button ${
                showCopied ? 'copied-button' : ''
              }`}
            >
              {this.state.showCopied ? 'Copied' : 'Copy'}
            </button>
          </CopyToClipboard>
          <button
            className="shadow-button button"
            onClick={this.handleUpdateGraphURL}
          >
            {'Set'}
          </button>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="toolbar-button-wrapper">
        {this.renderGraphURLInput()}
        <GraphiQL.Button
          title={'URL with query and variables as query-params'}
          label={'Get or Set query'}
          onClick={this.handleToggleURLListPopup}
        />
      </div>
    );
  }
}

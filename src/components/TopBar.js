import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class TopBar extends Component {
  static propTypes = {
    graphQLEndpoint: PropTypes.string,
    schemaFetchError: PropTypes.string,
    headers: PropTypes.object,
    onChangeURL: PropTypes.func,
    onEditHeaders: PropTypes.func
  };

  static defaultProps = {
    graphQLEndpoint: '',
    schemaFetchError: '',
    onChangeURL: () => {},
    headers: {},
    onEditHeaders: () => {}
  };

  constructor(props) {
    super(props);

    this.state = {
      inputFocused: false
    };
  }

  setURLInputRef = ref => {
    this.urlInputRef = ref;
  };

  handleInputKeyPress = event => {
    if (event.which === 13) {
      if (this.urlInputRef) {
        this.urlInputRef.blur();
      }
      this.handleFetchSchema();
      event.preventDefault();
      return false;
    }

    return true;
  };

  handleFetchSchema = () => {
    const url = this.urlInputRef.value;
    this.props.onChangeURL(url);
  };

  render() {
    const isError = Boolean(this.props.schemaFetchError);
    const wrapperClass = `url-input-wrapper ${isError ? 'error' : ''}`;
    const totalHeaders = Object.keys(this.props.headers).length;
    return (
      <div className="top-bar">
        <form>
          <div className={wrapperClass} tabIndex={-1}>
            <div className="url-input-label">{'GraphQL Endpoint'}</div>
            <input
              ref={this.setURLInputRef}
              className="url-input"
              type={'text'}
              defaultValue={this.props.graphQLEndpoint || ''}
              placeholder={'http://localhost:8080/graphql'}
              onKeyPress={this.handleInputKeyPress}
            />
          </div>
        </form>
        <button
          className="shadow-button fetch-button"
          onClick={this.handleFetchSchema}
        >
          {'Fetch'}
        </button>
        <button
          className="shadow-button edit-headers-button"
          onClick={this.props.onEditHeaders}
        >
          {`Edit HTTP headers (${totalHeaders})`}
        </button>
      </div>
    );
  }
}

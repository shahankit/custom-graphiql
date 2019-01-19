import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EditHeaderFormItem from './EditHeaderFormItem';

export default class EditHeaderModal extends Component {
  static propTypes = {
    headers: PropTypes.object.isRequired,
    onUpdateHeaders: PropTypes.func,
    onEditHeadersCancel: PropTypes.func
  };

  constructor(props) {
    super(props);

    const headerKeys = Object.keys(this.props.headers);
    const headerValues = Object.values(this.props.headers);
    headerKeys.push('');
    headerValues.push('');
    const validHeaders = headerKeys.map(() => true);

    this.state = {
      headerKeys,
      headerValues,
      validHeaders
    };
  }

  handleSaveButton = () => {
    const headerKeysCopy = this.state.headerKeys.slice(
      0,
      this.state.headerKeys.length - 1
    );
    const validHeaders = headerKeysCopy.map(
      headerKey => headerKey.length !== 0 && !headerKey.includes(' ')
    );
    validHeaders.push(true);
    this.setState({ validHeaders });
    const allHeadersValid = validHeaders.reduce((p, c) => p && c, true);
    if (allHeadersValid) {
      const headerValuesCopy = this.state.headerValues.slice(
        0,
        this.state.headerValues.length - 1
      );
      const newHeaders = {};
      headerKeysCopy.forEach(
        (headerKey, index) => (newHeaders[headerKey] = headerValuesCopy[index])
      );
      if (this.props.onUpdateHeaders) {
        this.props.onUpdateHeaders(newHeaders);
      }
    }
  };

  handleUpdateHeaderKey = (key, index) => {
    const headerKeys = this.state.headerKeys;
    this.setState({
      headerKeys: [
        ...headerKeys.slice(0, index),
        key,
        ...headerKeys.slice(index + 1)
      ]
    });
  };

  handleUpdateHeaderValue = (value, index) => {
    const headerValues = this.state.headerValues;
    this.setState({
      headerValues: [
        ...headerValues.slice(0, index),
        value,
        ...headerValues.slice(index + 1)
      ]
    });
  };

  handleHeaderDeleted = index => {
    if (this.state.headerKeys.length === 1) {
      return;
    }
    this.state.headerKeys.splice(index, 1);
    this.state.headerValues.splice(index, 1);
    this.state.validHeaders.splice(index, 1);
    this.setState({});
  };

  handleInputFocus = index => {
    const isLast = index === this.state.headerKeys.length - 1;
    const validHeaders = this.state.validHeaders;
    const headerKeys = this.state.headerKeys;
    const headerValues = this.state.headerValues;

    const updatedValidHeaders = [
      ...validHeaders.slice(0, index),
      true,
      ...validHeaders.slice(index + 1)
    ];
    if (isLast) {
      updatedValidHeaders.push(true);
    }

    this.setState({
      validHeaders: updatedValidHeaders,
      headerKeys: isLast ? [...headerKeys, ''] : headerKeys,
      headerValues: isLast ? [...headerValues, ''] : headerValues
    });
  };

  renderFormItem = (_, index) => {
    const { headerKeys, headerValues, validHeaders } = this.state;
    return (
      <EditHeaderFormItem
        key={index}
        index={index}
        totalItems={headerKeys.length}
        headerKey={headerKeys[index]}
        headerValue={headerValues[index]}
        isValid={validHeaders[index]}
        onInputFocus={this.handleInputFocus}
        onDeleteHeader={this.handleHeaderDeleted}
        onUpdateKey={this.handleUpdateHeaderKey}
        onUpdateValue={this.handleUpdateHeaderValue}
      />
    )
  }

  renderFormItems() {
    const { headerKeys } = this.state;
    return headerKeys.map(this.renderFormItem);
  }

  render() {
    return (
      <div className="edit-form-modal-container">
        <div className="edit-form-modal">
          <div className="title">{'Edit HTTP headers'}</div>
          {this.renderFormItems()}
          <div className="buttons-container">
            <button
              className="shadow-button"
              onClick={this.props.onEditHeadersCancel}
            >
              {'Cancel'}
            </button>
            <button
              className="shadow-button save-button"
              onClick={this.handleSaveButton}
            >
              {'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

import React, { Component } from 'react';
import styles from './styles';
import EditHeaderFormItem from './EditHeaderFormItem';
s
export default class EditHeaderModal extends Component {
  constructor(props) {
    super(props);

    const headerKeys = Object.keys(this.props.headers);
    const headerValues = Object.values(this.props.headers);
    headerKeys.push('');
    headerValues.push('');
    const validHeaders = headerKeys.map(() => true);

    this.state = {
      headerKeys: headerKeys,
      headerValues: headerValues,
      validHeaders: validHeaders
    };
  }

  saveButtonPressed = () => {
    const headerKeysCopy = this.state.headerKeys.slice(0, this.state.headerKeys.length - 1);
    const validHeaders = headerKeysCopy.map(headerKey => headerKey.length !== 0 && !headerKey.includes(' '));
    validHeaders.push(true);
    this.setState({
      validHeaders: validHeaders
    });
    const allHeadersValid = validHeaders.reduce((p, c) => (p && c), true);
    if (allHeadersValid) {
      const headerValuesCopy = this.state.headerValues.slice(0, this.state.headerValues.length - 1);
      const newHeaders = {};
      headerKeysCopy.forEach((headerKey, index) => (newHeaders[headerKey] = headerValuesCopy[index]));
      this.props.updateHeaders && this.props.updateHeaders(newHeaders);
    }
  }

  updateKey = (key, index) => {
    this.state.headerKeys[index] = key;
    this.setState({});
  }

  updateValue = (value, index) => {
    this.state.headerValues[index] = value;
    this.setState({});
  }


  deleteHeader = (index) => {
    if (this.state.headerKeys.length === 1) {
      return;
    }
    this.state.headerKeys.splice(index, 1);
    this.state.headerValues.splice(index, 1);
    this.state.validHeaders.splice(index, 1);
    this.setState({});
  }

  onInputFocus = (index) => {
    const isLast = index === (this.state.headerKeys.length - 1);
    this.state.validHeaders[index] = true;
    isLast && this.pushNewHeader();
    this.setState({});
  }

  pushNewHeader = () => {
    this.state.headerKeys.push('');
    this.state.headerValues.push('');
    this.state.validHeaders.push(true);
  }

  renderFormItems() {
    const headerKeys = this.state.headerKeys;
    const headerValues = this.state.headerValues;
    const validHeaders = this.state.validHeaders;
    return headerKeys.map((headerItem, index) => {
      return (
        <EditHeaderFormItem
          key={index}
          index={index}
          totalItems={headerKeys.length}
          headerKey={headerKeys[index]}
          headerValue={headerValues[index]}
          isValid={validHeaders[index]}
          onInputFocus={this.onInputFocus}
          deleteHeader={this.deleteHeader}
          updateKey={this.updateKey}
          updateValue={this.updateValue}
        />
      );
    });
  }

  render() {
    return (
      <div style={styles.editHeaderModalContainer}>
        <div style={styles.editHeaderModal}>
          <div style={styles.editHeaderModelTitle}>Edit HTTP headers</div>
          {this.renderFormItems()}
          <div style={styles.editModalButtonsWrapper}>
            <div
              className={'shadowButton'}
              style={styles.shadowButton}
              onClick={this.props.hideEditHeaderModal}
            >
              Cancel
            </div>
            <div
              className={'shadowButton'}
              style={Object.assign({}, styles.shadowButton, styles.editHeaderModalSaveButton)}
              onClick={this.saveButtonPressed}
            >
              Save
            </div>
          </div>
        </div>
      </div>
    );
  }
}

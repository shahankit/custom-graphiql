import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class EditHeaderFormItem extends Component {
  static defaultProps = {
    onUpdateKey: () => {},
    onUpdateValue: () => {},
    onInputFocus: () => {},
    onDeleteHeader: () => {}
  };

  static propTypes = {
    index: PropTypes.number.isRequired,
    totalItems: PropTypes.number.isRequired,
    isValid: PropTypes.bool.isRequired,
    headerKey: PropTypes.string.isRequired,
    headerValue: PropTypes.string.isRequired,
    onUpdateKey: PropTypes.func,
    onUpdateValue: PropTypes.func,
    onInputFocus: PropTypes.func,
    onDeleteHeader: PropTypes.func
  };

  renderDeleteButton() {
    const { index, totalItems, onDeleteHeader } = this.props;
    const isLast = index === totalItems - 1;

    if (isLast) {
      return (
        <div className="delete-button delete-button-stub" />
      );
    }

    return (
      <button
        className="shadow-button delete-button"
        onClick={() => onDeleteHeader(index)}
      >
        <svg
          height="16"
          role="img"
          version="1.1"
          viewBox="0 0 12 16"
          width="12"
        >
          <path
            fillRule="evenodd"
            d="M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48z"
          />
        </svg>
      </button>
    );
  }

  render() {
    const {
      isValid,
      headerKey,
      headerValue,
      onUpdateKey,
      onUpdateValue,
      onInputFocus,
      index
    } = this.props;
    return (
      <div className="edit-form-input-item">
        <div className={`input-row ${isValid ? '' : 'input-row-invalid'}`}>
          <input
            className="input key-input"
            placeholder={'key'}
            value={headerKey}
            onFocus={() => onInputFocus(index)}
            onChange={event => onUpdateKey(event.target.value, index)}
          />
          <input
            className="input value-input"
            placeholder={'value'}
            value={headerValue}
            onFocus={() => onInputFocus(index)}
            onChange={event => onUpdateValue(event.target.value, index)}
          />
        </div>
        {this.renderDeleteButton()}
      </div>
    );
  }
}

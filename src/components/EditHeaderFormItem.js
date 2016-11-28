import React, { Component } from 'react';
import styles from './styles';

export default class EditHeaderFormItem extends Component {
  render() {
    const isLast = this.props.index === (this.props.totalItems - 1);
    return (
      <div style={styles.editModalFormItem}>
        <div
          className={'editModalInputWrapper'}
          style={Object.assign({}, styles.editModalInputWrapper, this.props.isValid ? null : { backgroundColor: '#F8EDED' })}
        >
          <input
            className={'editModalInput'}
            style={Object.assign({}, styles.editModalInput, styles.editModelKeyInput)}
            placeholder={'key'}
            value={this.props.headerKey}
            onFocus={() => this.props.onInputFocus(this.props.index)}
            onChange={event => this.props.updateKey(event.target.value, this.props.index)}
          />
          <input
            className={'editModalInput'}
            style={Object.assign({}, styles.editModalInput, styles.editModelValueInput)}
            placeholder={'value'}
            value={this.props.headerValue}
            onFocus={() => this.props.onInputFocus(this.props.index)}
            onChange={event => this.props.updateValue(event.target.value, this.props.index)}
          />
        </div>
        {(() => {
          if (isLast) {
            return <div style={Object.assign({}, styles.editModalFormItemDelete, styles.editModalFormItemDeleteStub)} />
          }

          return (
            <div
              className={'editModalFormItemDelete'}
              style={styles.editModalFormItemDelete}
              onClick={() => this.props.deleteHeader(this.props.index)}
            >
              <svg
                height="16"
                role="img"
                version="1.1"
                viewBox="0 0 12 16"
                width="12"
              >
                <path fillRule="evenodd" d="M7.48 8l3.75 3.75-1.48 1.48L6 9.48l-3.75 3.75-1.48-1.48L4.52 8 .77 4.25l1.48-1.48L6 6.52l3.75-3.75 1.48 1.48z" />
              </svg>
            </div>
          );
        })()}
      </div>
    );
  }
}

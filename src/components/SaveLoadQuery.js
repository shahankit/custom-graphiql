import React, { Component } from 'react';
import styles from './styles';
import GraphiQL from 'graphiql';
import { autobind } from 'core-decorators';

export default class SaveLoadQuery extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showSavedQueriesPopup: false,
      savedQueriesSearchInputFocused: false,
      savedQueriesSearchText: '',
    };
  }

  @autobind
  removeQueryPressed(event, queryName) {
    event.stopPropagation();
    const currentURL = this.props.graphQLEndpoint;
    const savedQueries = this.props.getSavedQueries ? this.props.getSavedQueries() : {};
    delete savedQueries[queryName];
    const savedQueriesString = JSON.stringify(savedQueries);
    this.props.setSavedQueries && this.props.setSavedQueries(savedQueriesString);
    this.setState({});
  }

  @autobind
  saveQueryPressed(queryName) {
    const currentURL = this.props.graphQLEndpoint;
    const savedQueries = this.props.getSavedQueries ? this.props.getSavedQueries() : {};
    const encodedQuery = encodeURIComponent(this.props.query);
    const encodedVariables = encodeURIComponent(this.props.variables);
    const currentResponse = this.props.getCurrentResponse ? this.props.getCurrentResponse() : '';
    const encodedResponse = encodeURIComponent(currentResponse);
    savedQueries[queryName.replace(' ', '-')] = `${currentURL}?query=${encodedQuery}&variables=${encodedVariables}&response=${encodedResponse}`;
    const savedQueriesString = JSON.stringify(savedQueries);
    this.props.setSavedQueries && this.props.setSavedQueries(savedQueriesString);
    this.setState({
      showSavedQueriesPopup: false,
      savedQueriesSearchText: '',
    });
  }

  @autobind
  loadSavedQueryPressed(queryString) {
    this.props.setQueryFromString && this.props.setQueryFromString(queryString);
    this.setState({
      showSavedQueriesPopup: false
    });
  }

  @autobind
  saveLoadQueryPressed() {
    this.setState({
      showSavedQueriesPopup: !this.state.showSavedQueriesPopup
    });
  }

  @autobind
  renderSavedQueriesPopup() {
    if (!this.state.showSavedQueriesPopup) {
      return null;
    }

    const savedQueries = this.props.getSavedQueries ? this.props.getSavedQueries() : {};

    const querySearchText = this.state.savedQueriesSearchText;
    const searchInputStyle = this.state.savedQueriesSearchInputFocused ? styles.searchInputFocused : null;
    return (
      <div style={styles.popup}>
        <input
          onChange={event => this.setState({ savedQueriesSearchText: event.target.value })}
          style={Object.assign({}, styles.searchInput, searchInputStyle)}
          type={'text'}
          placeholder={'Find or save query...'}
          onFocus={() => this.setState({ savedQueriesSearchInputFocused: true })}
          onBlur={() => this.setState({ savedQueriesSearchInputFocused: false })}
          autoFocus={true}
        />
        {Object.keys(savedQueries)
          .sort()
          .filter(value => value.toLowerCase().includes(querySearchText))
          .map(queryName => (
            <div
              key={queryName}
              className={'menuListButton'}
              style={styles.menuListButton}
              onClick={() => this.loadSavedQueryPressed(savedQueries[queryName])}
            >
              {queryName}
              <div
                style={styles.crossButton}
                className={'crossButton'}
                onClick={event => this.removeQueryPressed(event, queryName)}
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
            </div>
        ))}
        {(() => {
          const hasSavedQuery = Object.keys(savedQueries).find(item => (querySearchText.toLowerCase() === item.toLowerCase()));
          if (querySearchText.length > 0 && !hasSavedQuery) {
            return (
              <div
                className={'saveQueryButton'}
                style={styles.saveQueryButton}
                onClick={() => this.saveQueryPressed(querySearchText)}
              >
                Save current query as <span style={styles.saveQueryButtonLabel}>{querySearchText}</span>
              </div>
            );
          }

          return null;
        })()}
      </div>
    );
  }

  render() {
    return (
      <div style={styles.toolBarButtonWrapper}>
        {this.renderSavedQueriesPopup()}
        <GraphiQL.ToolbarButton
          title={'Save or Load query'}
          label={'Save / Load'}
          onClick={this.saveLoadQueryPressed}
        />
      </div>
    );
  }
}

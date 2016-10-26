import React, { Component } from 'react';
import GraphiQL from 'graphiql';
import '../../node_modules/graphiql/graphiql.css';
import { autobind } from 'core-decorators';

export default class CustomGraphiQL extends Component {
  @autobind
  async graphQLFetcher(graphQLParams) {
    const response = await fetch('http://lyearn.herokuapp.com/graphql', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(graphQLParams),
    });
    const schema = await response.json();
    this.schema = schema;
    return schema
  }

  render() {
    return (
      <GraphiQL fetcher={this.graphQLFetcher} />
    );
  }
}

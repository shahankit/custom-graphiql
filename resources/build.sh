#!/bin/sh

set -e

if [ ! -d "node_modules/.bin" ]; then
  echo "Be sure to run \`npm install\` before building GraphiQL."
  exit 1
fi

rm -rf dist/ && mkdir -p dist/
babel src --ignore __tests__ --out-dir dist/
echo "Bundling custom-graphiql.js..."
browserify -g browserify-shim -s CustomGraphiQL dist/index.js > custom-graphiql.js
echo "Bundling graphiql.min.js..."
browserify -g browserify-shim -g uglifyify -s CustomGraphiQL dist/index.js 2> /dev/null | uglifyjs -c --screw-ie8 > custom-graphiql.min.js 2> /dev/null
echo "Done"

#!/bin/sh

set -e

if [ ! -d "node_modules/.bin" ]; then
  echo "Be sure to run \`npm install\` before building CustomGraphiQL."
  exit 1
fi

rm -rf dist/ && mkdir -p dist/
BABEL_ENV=production babel src --ignore __tests__ --out-dir dist/
echo "Bundling custom-graphiql.js..."
browserify -g browserify-shim -s CustomGraphiQL dist/index.js > custom-graphiql.js
echo "Bundling custom-graphiql.min.js..."
browserify -g browserify-shim -g uglifyify -s CustomGraphiQL dist/index.js 2> /dev/null | uglifyjs -c --screw-ie8 > custom-graphiql.min.js 2> /dev/null
echo "Bundling custom-graphiql.css..."
cat css/*.css > custom-graphiql.css
echo "Done"

yarn build

mkdir -p ./website/js
mkdir -p ./website/css

cp ./custom-graphiql.js ./custom-graphiql.min.js ./website/js/
cp ./custom-graphiql.css ./website/css/

/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

const express = require('express');

const app = express();

app.use(express.static(__dirname));
app.use('/graphql', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(8081, () => console.log('Started on http://localhost:8081/'));

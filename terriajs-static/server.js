var express = require('express');

var path = require('path');

var app = express();

app.use('/media', express.static(__dirname + '/media'));
app.use(express.static(path.join(__dirname, 'dist')));

app.listen(3000);
console.log('Listening on port 3000');
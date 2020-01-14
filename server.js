const express = require('express');
const app = express();
const server = require('http').Server(app);

app.use('/assets', express.static(`${__dirname}/assets`));

app.get('/',function(req, res){
  res.sendFile(`${__dirname}/index.html`);
});

server.listen(8080, function() {
  console.log('Listening on ' + server.address().port);
});
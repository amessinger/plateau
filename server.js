const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);

const maps = [
  {
    image: 'map0.png',
    cellSize: 32,
    width: 1088,
    height: 960
  },
  {
    image: 'map1.png',
    cellSize: 32,
    width: 544,
    height: 416
  }
];

app.use('/assets', express.static(`${__dirname}/assets`));
app.use('/node_modules', express.static(`${__dirname}/node_modules`));

app.get('/',function(req, res){
  res.sendFile(`${__dirname}/index.html`);
});

app.get('api/maps/:mapId',function({ params }, res){
  res.send(maps[params.mapId]);
});

server.listen(8080, function() {
  console.log('Listening on ' + server.address().port);
  io.on('connection', function(socket) {
    socket.on('hoverCell', function(data) {
      console.log('hoverCell', data);
      socket.broadcast.emit('hoverCell', data);
    });
  });
});
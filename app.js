// Module Dependencies

var express = require('express');
var stylus = require('stylus');
var nib = require('nib');
var sio = require('socket.io');

var app = express.createServer();

// Configuration

function compile (str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib());
};

app.configure(function () {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(stylus.middleware({ src: __dirname + '/public', compile: compile }))
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// Routes

app.get('/', function (req, res) {
  res.render('index', {
	  layout: false
	});
});

// Listen

app.listen(80);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

// Socket.IO

var io = sio.listen(app);
var nicknames = {};

io.sockets.on('connection', function (socket) {
  socket.on('user message', function (msg) {
    socket.broadcast.emit('user message', socket.nickname, msg);
  });

  socket.on('nickname', function (nick, callback) {
    if (nicknames[nick]) {
      callback(true);
    } else {
      callback(false);
      nicknames[nick] = socket.nickname = nick;
      socket.broadcast.emit('announcement', nick + ' connected');
      io.sockets.emit('nicknames', nicknames);
    }
  });

  socket.on('disconnect', function () {
    if (!socket.nickname) return;

    delete nicknames[socket.nickname];
    socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
    socket.broadcast.emit('nicknames', nicknames);
  });
});
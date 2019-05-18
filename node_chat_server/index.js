var app = require('express')();
var http = require('http').Server(app);
var port = process.env.PORT || 3000;
var chat = require('./chat.js')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/coords', function(req, res){
  res.sendFile(__dirname +  '/map.html');
});

chat.init();

http.listen(port, function(){
  console.log('listening on *:' + port);
});
 
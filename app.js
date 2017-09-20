var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
// var expressValidator = require('express-validator');

// autentication packages
var session = require('express-session');
var passport = require('passport')

var index = require('./routes/index');
var users = require('./routes/users');


var app = express();

var helmet = require('helmet');
app.use(helmet());

require('dotenv').config(); // make sure we can use things in .env file

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(expressValidator());// this line must be immediately after any bodyParser middlewares!
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'gjsodifjsgdmfoigs',
  resave: false,
  saveUninitialized: false, //only take cookies who loged in our app
  // cookie: { secure: true }
}))
app.use(passport.initialize());
app.use(passport.session());

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



// Handlebars default config
const hbs = require('hbs');
const fs = require('fs');

const partialsDir = __dirname + '/views/partials';

const filenames = fs.readdirSync(partialsDir);

filenames.forEach(function (filename) {
  const matches = /^([^.]+).hbs$/.exec(filename);
  if (!matches) {
    return;
  }
  const name = matches[1];
  const template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');
  hbs.registerPartial(name, template);
});

hbs.registerHelper('json', function(context) {
    return JSON.stringify(context, null, 2);
});


/////////////////////////////////////////////////////////
rooms = {} // record the username for all the rooms {'roomid':['name1','name2',...]}
var a=0,b=0,c=0,d=0;

var server =  require('http').createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 8080;
server.listen(port);
console.log('server running, listening to port ' + port);

io.sockets.on('connection', function(socket){  

  // New user connected
  socket.on('new user', function(data){
    console.log('server received new user info: \n'+JSON.stringify(data));
    var currRoom = data.roomid;
    var currUser = data.username;
    socket.username = currUser;
    socket.roomid = currRoom;
    socket.join(currRoom);
    if(currRoom in rooms){
      rooms[currRoom].push(currUser);   
    }else{ // create a new room
      rooms[currRoom]= [currUser];
    }
    // inform currRoom 'new user joined'
    io.to(currRoom).emit('new user added',{
      'name': currUser,
      'userSet': rooms[currRoom]
    });
  });

  // Disconnect
  socket.on('disconnect', function(){
    console.log('server side Disconnect detected');
    var currRoom = socket.roomid;
    var currUser = socket.username;
    if(typeof rooms[currRoom]!= ('undifined'||null)){
      rooms[currRoom].splice(rooms[currRoom].indexOf(currUser), 1);
      // inform currRoom 'user left'
      if(rooms[currRoom].length>0){
        socket.to(currRoom).emit('user left',{
          'name': currUser,
          'userSet': rooms[currRoom]
        });
      } 
    }
  });

  // Send Message
  socket.on('send message', function(nmsg){
    console.log('send message detected in app.js: ' + nmsg);
    var currRoom = socket.roomid;
    var currUser = socket.username;
    io.to(currRoom).emit('new message', {
      user: currUser,
      msg: nmsg
    });
  });

  //////////////////////////////////////vedio webrtc
  socket.on('message', function(message) {
    console.log('Client said: ', message);
    var currRoom = socket.roomid;
    console.log('io emit to: ',currRoom);
    socket.to(currRoom).emit('message', message);
  });


  socket.on('startpolling',function(){
    var currRoom = socket.roomid;
    console.log('staring polling detected server');
    a = 0;
    b = 0;
    c = 0;
    d = 0;
    io.to(currRoom).emit('startnewpoll');
  });
  socket.on('abcd', function(message){
    console.log('abcd received')
    var currRoom = socket.roomid;
    console.log(message)
    if(message == "A") a++;
    else if (message == "B") b++;
    else if (message == "C") c++;
    else d++;
    io.to(currRoom).emit('poll update', {
      a:a,
      b:b,
      c:c,
      d:d
    });
  });

});

module.exports = app;

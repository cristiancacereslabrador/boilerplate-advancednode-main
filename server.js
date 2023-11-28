"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session")
const passport = require("passport")
const bcrypt = require('bcrypt')
const routes = require('./routes.js');
const auth = require('./auth.js');

const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);
const passportSocketIo = require('passport.socketio');
//const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

const { ObjectID } = require('mongodb');
const LocalStrategy = require('passport-local');

////////////////////////////
app.set("view engine", "pug");
app.set("views", "./views/pug");
/////////////////////////////
app.use(session({
  secret: process.env.SESSION_SECRET || '15420586',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false },
  key: 'express.sid',
  store: store
}));
app.use(passport.initialize())
app.use(passport.session())

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);
myDB(async client => {
  const myDataBase = await client.db('database').collection('users');
  
  routes(app, myDataBase)
  auth(app, myDataBase)
  
  let currentUsers = 0;
  io.on('connection', socket => {
    ++currentUsers;
    io.emit('user',  {
      username: socket.request.user.username,
      currentUsers,
      connected: true
    });

    socket.on('chat message', (message) => {
      io.emit('chat message', { username: socket.request.user.username, message });
    });

    console.log('A user has connected');
    
    socket.on('disconnect', () => {
      console.log('A user has disconnected');
      --currentUsers;
      io.emit('user count', {
        username: socket.request.user.username,
        currentUsers,
        connected: false
      });
      /*anything you want to do on disconnect*/
    });
    console.log('user ' + socket.request.user.username + ' connected');
  });
  // Be sure to change the title
  // Serialization and deserialization here...
    // Be sure to add this...


}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('index', { title: e, message: 'Unable to connect to database' });
  });
});

// app.route("/").get((req, res) => {
//   res.render("index.pug", { title: 'Hello', message: 'Please log in' });
// });
function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}


const PORT = process.env.PORT;
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});

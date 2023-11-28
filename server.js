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




const { ObjectID } = require('mongodb');

const LocalStrategy = require('passport-local');

const app = express();

fccTesting(app); //For FCC testing purposes
////////////////////////////
app.set("view engine", "pug");
app.set("views", "./views/pug");



const http = require('http').createServer(app);
const io = require('socket.io')(http);
/////////////////////////////
app.use(session({
  secret: process.env.SESSION_SECRET || '15420586',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(passport.initialize())
app.use(passport.session())

////////////////////////
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  routes(app, myDataBase)
  auth(app, myDataBase)

  let currentUsers = 0;
  io.on('connection', socket => {
    ++currentUsers;
    io.emit('user count', currentUsers);
    console.log('A user has connected');
    
    socket.on('disconnect', () => {
      console.log('A user has disconnected');
      --currentUsers;
      io.emit('user count', currentUsers);
      /*anything you want to do on disconnect*/
    });
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

const PORT = process.env.PORT;
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});

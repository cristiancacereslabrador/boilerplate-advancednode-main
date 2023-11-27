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

/////////////////////////////
app.use(session({
  secret: process.env.SESSION_SECRET || '15420586',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));
passport.initialize()
passport.session()

////////////////////////
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  routes(app, myDataBase)
  auth(app, myDataBase)
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});

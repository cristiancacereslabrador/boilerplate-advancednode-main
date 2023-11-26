"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session")
const passport = require("passport")

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

passport.use(new LocalStrategy((username, password, done) => {
  myDataBase.findOne({ username: username }, (err, user) => {
    console.log(`User ${username} attempted to log in.`);
    if (err) return done(err);
    if (!user) return done(null, false);
    if (password !== user.password) return done(null, false);
    return done(null, user);
  });
}));

////////////////////////
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

myDB(async client => {
  const myDataBase = await client.db('database').collection('users');

  // Be sure to change the title
  app.route('/').get((req, res) => {
    // Change the response to render the Pug template
    res.render('index', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true
    });
  });
  app.route('/login').post(passport.authenticate('local',{ failureRedirect: '/' }), (req, res) =>{
    res.redirect('/profile')
  }) 
  app.route('/profile').get(ensureAuthenticated, (req, res) =>{
    res.render('profile', {username: req.user.username})
  })

  



  // Serialization and deserialization here...
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  
  passport.deserializeUser((id, done) => {
    done(null, null);
     myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
     done(null, doc);
   });
  });
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

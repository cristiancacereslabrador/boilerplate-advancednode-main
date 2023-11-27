"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session")
const passport = require("passport")
const bcrypt = require('bcrypt')

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
    if (!bcrypt.compareSync(password !== user.password)) return done(null, false);
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
      showLogin: true,
      showRegistration: true
    });
  });
  app.route('/login').post(passport.authenticate('local',{ failureRedirect: '/' }), (req, res) =>{
    res.redirect('/profile')
  }) 
  app.route('/profile').get(ensureAuthenticated, (req, res) =>{
    res.render('profile', {username: req.user.username})
  })
  app.route('/logout')
  .get((req, res) => {
    req.logout();
    res.redirect('/');
});
app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});
app.route('/register')
.post((req, res, next) => {
  const hash = bcrypt.hashSync(req.body.password, 12)
  myDataBase.findOne({ username: req.body.username }, (err, user) => {
    if (err) {
      next(err);
    } else if (user) {
      res.redirect('/');
    } else {
      myDataBase.insertOne({
        username: req.body.username,
        //password: req.body.password
        password: hash,
      },
        (err, doc) => {
          if (err) {
            res.redirect('/');
          } else {
            // The inserted document is held within
            // the ops property of the doc
            next(null, doc.ops[0]);
          }
        }
      )
    }
  })
},
  passport.authenticate('local', { failureRedirect: '/' }),
  (req, res, next) => {
    res.redirect('/profile');
  }
);



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

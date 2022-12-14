require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session")
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook");
const findOrCreate = require('mongoose-findorcreate')


const app = express();
app.use(express.static("public"));    
app.set("view engine", "ejs");        
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(session({
    secret: process.env.CLIENT_SECRET,
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");


const userSchema = new mongoose.Schema({

    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: [String]
});


//Plugins

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());


//Oauth Serilizer & deserializer

passport.serializeUser(function(user, done) {
    done(null, user.id);

});
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});


//Google Configure Strategy

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({
            googleId: profile.id
        }, function(err, user) {
            return cb(err, user);
        });
    }
));

// Facebook Configure Strategy

passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({
            facebookId: profile.id
        }, function(err, user) {
            return cb(err, user);
        });
    }
));


app.get("/", (req, res) => {

    res.render("home");

});

app.get('/auth/google',
    passport.authenticate('google', {
        scope: ["profile"]
    }));

app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: "/login"
    }),
    function(req, res) {
        // Successful authentication, redirect secrets.
        res.redirect('/secrets');
    });


app.get('/auth/facebook',
    passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', {
        failureRedirect: '/login'
    }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });



// **********************Login Route*************************


app.route("/login")
    .get((req, res) => {


        res.render("login");

    })
    .post((req, res) => {


        const user = new User({

            username: req.body.username,
            password: req.body.password
        })
        req.login(user, (err) => {

            if (err)
                console.log(err);
            else
                passport.authenticate("local")(req, res, () => {

                    res.redirect("/secrets");

                })

        })

    });


// **********************Register Route*************************


app.route("register")
    .get((req, res) => {


        res.render("register");

    })
    .post((req, res) => {

        User.register({
            username: req.body.username
        }, req.body.password, (err, user) => {


            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {

                passport.authenticate("local")(req, res, () => {

                    res.redirect("/secrets")


                })
            }
        })


    });


 // **********************Secrets & Logout Route*************************
   

app.get("/secrets", (req, res) => {


    if (req.isAuthenticated()) {

        res.render("secrets", {
            secrets: req.user.secret
        });




    } else {
        res.redirect("/login");
    }

})

app.get("/logout", (req, res) => {

    req.logOut((err) => {
        if (err)
            console.log(err);
        else
            res.redirect("/")
    });


});

// **********************Submit Route*************************


app.route("/submit")
    .get((req, res) => {


        if (req.isAuthenticated()) {
            res.render("submit");
        } else {
            res.render("login");
        }


    }).post((req, res) => {
        User.findById(req.user._id, (err, foundUser) => {

            if (err)
                console.log(err)
            else {

                foundUser.secret.push(req.body.secret);
                foundUser.save();
                res.redirect("/secrets");

            }

        })

    });



app.listen(3000, () => {
    console.log("server strated at port 3000");

})
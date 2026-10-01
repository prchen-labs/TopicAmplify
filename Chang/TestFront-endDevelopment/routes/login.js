const { requiredEnv } = require('../../../config/required-env.cjs');
const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const {	User } = require('../models/user'); // User Model
const app = express(); //不確定有無衝突
const router = express.Router();
const ejs = require('ejs');
const path = require('path');
// 設置模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/', router);
router.use(bodyParser.urlencoded({	extended: true }));
router.use(bodyParser.json());
router.use(cookieParser());
router.use(session({
	secret: requiredEnv('SESSION_SECRET'),
	resave: true,
	saveUninitialized: true
}));
router.use(passport.initialize());
router.use(passport.session());
router.use(flash());
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        console.log(`username: "${username}"`);
        const user = await User.findOne({
            username: username
        });
        if (!user) {
            console.log('Incorrect username.');
            return done(null, false, { message: 'Incorrect username.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            console.log('isMatch');
            return done(null, user);
        } else {
            console.log('Incorrect password.');　　
            return done(null, false, { message: 'Incorrect password.' });
        }
    } catch (err) {
        console.log('err');
        return done(err);
    }
}));
passport.serializeUser((user, done) => {
	done(null, user.id);
});
passport.deserializeUser((id, done) => {
	User.findById(id)
		.then(user => {
			done(null, user);
		})
		.catch(err => {
			done(err);
		});
});
// GET login page
router.get('/login', (req, res) => {
    const errorMessage = req.flash('error')[0] || false;
    console.log('errorMessage: ',errorMessage);
    res.render('Login', { errorMessage });
});
// POST login page
router.post('/login', passport.authenticate('local', {
	successRedirect: '/user',
	failureRedirect: '/login',
	failureFlash: true
}));
router.get('/user', (req, res) => {
    req.session.user = req.user; // 儲存用戶session資訊
    
    res.redirect('/');

});
module.exports = router;
var express = require('express');
var router = express.Router();

var bcrypt = require('bcrypt');
const saltRounds = 10;

var passport = require('passport')

/* GET home page. */
router.get('/', function(req, res) {
	if(!req.isAuthenticated()){
		res.render('register', { title: 'Registration Room' });
	}
	else{
		const db = require('../db.js');

		db.query('select * from rooms where id=(?)',req.user, function(error,results,fields){
			res.render('home', { 
				'roomname': JSON.stringify(results[0].roomname),
				'roomid': req.user
			});
		});
	}
});

router.get('/register', function(req, res) {
 	res.render('register', { title: 'Register Room' });
});
router.post('/register', function(req, res, next) {
	const roomname = req.body.roomname;
	const pw = req.body.password;
	const pw2 = (req.body.passwordMatch);

	// validation
	if(roomname == "")
		res.render('register', { 
			title: 'Registration Room',
			errorMessage: 'ERROR: Room Name can not be empty' })
	if(pw != pw2)
		res.render('register', { 
			title: 'Register Room',
			errorMessage: 'ERROR: password doesn\'t match!' })


	const db = require('../db.js');

	bcrypt.hash(pw, saltRounds, function(err, hash){
		db.query('INSERT INTO rooms (roomname, password) VALUES (?,?)',[roomname,hash], function(
		error,results,fields) {
			if(error){
				res.render('register', { title: 'Registration Room', errorMessage: error });
			}else{
				db.query(' select * from rooms where roomname=(?)',roomname, function(error,results,fields){
					room_id = results[0].id;
					console.log('user loged in room '+ room_id);
					req.login(room_id, function(err){
						res.redirect('/');
					});
				});
			}
		});
	});	
});

router.get('/login', function(req, res) {
 	res.render('login', { title: 'Join Room' });
});
router.post('/login', function(req, res, next) {
	const roomname = req.body.roomname;
	const pw = req.body.password;

	const db = require('../db.js');
	db.query('select * from rooms where roomname=(?)',roomname, function(
	error,results,fields) {
		console.log(results[0].password)
		bcrypt.compare(pw,results[0].password, function(err, result) {
			console.log(res)
			
			if(result)
				req.login(results[0].id, function(err){
					res.redirect('/');
				});
			else
				res.render('login', { 
					title: 'Join Room',
					errorMessage: 'ERROR: Authentification Failed!' 
				});
		});
	});
	

});

passport.serializeUser(function(room_id, done) {
  	done(null, room_id);
});

passport.deserializeUser(function(room_id, done) {
	done(null, room_id);
});

module.exports = router;

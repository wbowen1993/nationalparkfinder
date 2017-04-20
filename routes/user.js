var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var User = mongoose.model('User',new schema({
	id:ObjectId,
	first_name: String,
	last_name: String,
	email:{type:String, unique:true},
	password:String,
}));

mongoose.connect('mongodb://cis550:11111111@ds161630.mlab.com:61630/users');

router.get('/login',function(req,res,next){
	res.render('login',{msg:""});
});

router.get('/signup',function(req,res,next){
	res.render('signup',{msg:""});
});

router.get('/profile',function(req,res,next){
	if(req.session&&req.session.user){
		User.findOne({email:req.session.user.email},function(err,user){
			if(!user){
				req.session.reset();
				res.redirect('/login');
			}
			else{
				res.locals.user = user;
				res.render('profile',{email:user.email,lastname:user.last_name,firstname:user.first_name,session:"true"});
			}
		});
	}
	else
		res.redirect('/login');
	// res.render('profile');
});

router.get('/logout',function(req,res){
	req.session.reset();
	res.redirect('/');
});

router.post('/login',function(req,res,next){
	User.findOne({email:req.body.email},function(err,user){
		if(!user){
			res.render('login',{msg:"The user doesn't exist!"});
		}
		else{
			if(bcrypt.compareSync(req.body.password, user.password)){
				req.session.user = user;
				res.redirect('/profile');
			}
			else{
				res.render('login',{msg:"Password incorrect!"});
			}
		}
	});
});

router.post('/signup',function(req,res,next){
	var user = new User({
		first_name:req.body.firstname,
		last_name:req.body.lastname,
		email:req.body.email,
		password:bcrypt.hashSync(req.body.password)
	});
	user.save(function(err){
		if(err){
			var msg = "Something wrong happend, please try again.";
			if(err.code===11000){
				msg = "The email address has been registered.";
			}
			res.render('signup',{error:msg});
		}
		res.redirect('/login');
	});
});


function requireLogin(req,res,next){
	if(!req.user){
		res.redirect('/login');
	}
	else{
		next();
	}
}

module.exports = router;
var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');

var User = require('../model/user');
var User_rating = require('../model/user_rating');

mongoose.connect('mongodb://cis550:11111111@ds161630.mlab.com:61630/users');

router.get('/login',function(req,res,next){
	// mongoose.connection.close();
	res.render('login',{msg:""});
});

router.get('/signup',function(req,res,next){
	// mongoose.connection.close();
	res.render('signup',{msg:""});
});

router.get('/profile',function(req,res,next){
	if(req.session&&req.session.user){
		User.findOne({email:req.session.user.email},function(err,user){
			if(!user){
				req.session.reset();
				// mongoose.connection.close();
				res.redirect('/login');
			}
			else{
				res.locals.user = user;
				User_rating.findOne({email:req.session.user.email},function(err,user_rating){
					if(!user_rating){
						var park_name = [];
						res.render('profile',{email:user.email,lastname:user.last_name,firstname:user.first_name,session:"true",park_name:park_name});
					}
					else{
						res.render('profile',{email:user.email,lastname:user.last_name,firstname:user.first_name,session:"true",park_name:user_rating.park_name});
					}
				});
			}
		});
	}
	else{
		// mongoose.connection.close();
		res.redirect('/login');
	}
});
router.post('/profile',function(req,res,next){
	if(req.session&&req.session.user){
		User_rating.findOne({email:req.session.user.email},function(err,user_rating){
			if(!user_rating);
			else{
				var new_park_name = [];
	  			var park_name = user_rating.park_name;
	  			if(park_name.length>1){
	  				for(var i = 0;i<park_name.length;i++){
	  					if(park_name[i]!=req.body.park_name)
	  						new_park_name.push(park_name[i]);
	  				}
	  				User_rating.findOneAndUpdate({email:req.session.user.email},{email:req.session.user.email,park_name:new_park_name},function(err){
						if(err){
							console.log(err);
						}
						res.redirect('/profile');
					});
	  			}
	  			else{
	  				User_rating.findOneAndRemove({email:req.session.user.email},function(err){
  						if(err){
							console.log(err);
						}
						res.redirect('/profile');
  					});
	  			}
			}
		});
	}
	else{
		// mongoose.connection.close();
		res.redirect('/login');
	}
})

router.get('/logout',function(req,res){
	req.session.reset();
	// mongoose.connection.close();
	res.redirect('/');
});

router.post('/login',function(req,res,next){
	User.findOne({email:req.body.email},function(err,user){
		if(!user){
			// mongoose.connection.close();
			res.render('login',{msg:"The user doesn't exist!"});
		}
		else{
			if(bcrypt.compareSync(req.body.password, user.password)){
				req.session.user = user;
				// mongoose.connection.close();
				res.redirect('/profile');
			}
			else{
				// mongoose.connection.close();
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
			// mongoose.connection.close();
			res.render('signup',{error:msg});
		}
		// mongoose.connection.close();
		res.redirect('/login');
	});
});

module.exports = router;
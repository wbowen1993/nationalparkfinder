var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var mongoose = require('mongoose');
var mysql = require('mysql');
var multer = require('multer');
var upload = multer({dest:'src/img/profile_img/'});

var User = require('../model/user');
var User_fav = require('../model/user_fav');
var User_rating = require('../model/user_rating');

mongoose.connect('mongodb://cis550:11111111@ds161630.mlab.com:61630/users');

var connection = mysql.createConnection({
  host     : 'db-group8-mysql.cd4nksdzz6ad.us-east-1.rds.amazonaws.com',
  user     : 'adminUser',
  password : 'ThatsNotAPassword629451!', // This is not the correct password! Please enter your own.
  database : 'NationalParksMySql'
});



function getWeather(park_name,weather_set,callback){
	var query = "select n.img_url,code,w.description as description,low_temperature,high_temperature,sunrise_time,sunset_time from Weather w inner ";
	query += "join NationalPark n on n.Id = w.parkId where n.name='"+park_name+"';";
	connection.query(query, function(err, rows, fields) {
        if (err) console.log(err);
        else{
        	var new_weather = {
        		img:rows[0].img_url,
        		code:rows[0].code,
        		description:rows[0].description,
        		low_temperature:rows[0].low_temperature,
        		high_temperature:rows[0].high_temperature,
        		sunset:rows[0].sunset_time.substring(0,5),
        		sunrise:rows[0].sunrise_time.substring(0,5)
        	};
        	weather_set.push(new_weather);
        }
        callback();
    });
}

function getImg(park_name,image_set,callback) {
	var query = "select img_url from NationalPark where name = '"+park_name+"';";
	connection.query(query, function(err, rows, fields) {
        if (err) console.log(err);
        else{
        	image_set.push(rows[0].img_url);
        }
        callback();
    });
}

function state_stat(park_names,state,callback){
	if(park_names.length==1)
		var query = "select state,count(state) as num from NationalPark where name = '"+park_names[0]+"';";
	else{
		var query = "select state,count(state) as num from NationalPark where name = '"+park_names[0]+"'";
		for(var i=1;i<park_names.length;i++){
			query+="or name = '"+park_names[i]+"'";
		}
		query += "group by state;";
	}
	connection.query(query, function(err, rows, fields) {
        if (err) console.log(err);
        else{
        	for(var i=0;i<rows.length;i++){
        		var new_state={
        			name:rows[i].state,
        			num:rows[i].num
        		};
        		state.push(new_state);
        	}
        }
        callback();
    });
}


router.get('/login',function(req,res,next){
	// mongoose.connection.close();
	res.render('login',{msg:"",profile_img:""});
});

router.get('/signup',function(req,res,next){
	// mongoose.connect
	res.render('signup',{msg:"",profile_img:""});
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
				User_fav.findOne({email:req.session.user.email},function(err,user_fav){
					if(!user_fav){
						var park_name = [];
						User_rating.find({email:req.session.user.email},function(err,user_ratings){
							if(user_ratings.length==0){
								var user_ratings = [];
								var state_set = [];
								res.render('profile',{email:user.email,lastname:user.last_name,firstname:user.first_name,profile_img:user.profile_img,session:"true",
									park_name:park_name,user_ratings:user_ratings,state_set:state_set});
							}
							else{
								console.log(user_ratings);
								var img_set = [];
								var state_set = [];
								var names_set = [];
								for(var i = 0;i<user_ratings.length;i++){
									names_set.push(user_ratings[i].park_name);
									getImg(user_ratings[i].park_name,img_set,function(){
										if(img_set.length==user_ratings.length&&names_set.length==user_ratings.length){
											state_stat(names_set,state_set,function(){		
											res.render('profile',{email:user.email,lastname:user.last_name,firstname:user.first_name,profile_img:user.profile_img,session:"true",
												park_name:park_name,user_ratings:user_ratings,img_set:img_set,state_set:state_set});
											});
										}
									});
								}
							}
						});
					}
					else{
						var weather_set = [];
						var park_names = user_fav.park_name;
						for(var i = 0;i<park_names.length;i++){
							getWeather(park_names[i],weather_set,function(){
								if(weather_set.length==park_names.length){
									User_rating.find({email:req.session.user.email},function(err,user_ratings){
										if(user_ratings.length==0){
											var user_ratings = [];
											var state_set = [];
											res.render('profile',{email:user.email,lastname:user.last_name,firstname:user.first_name,profile_img:user.profile_img,session:"true",
												park_name:user_fav.park_name,user_ratings:user_ratings,weather_set:weather_set,state_set:state_set});
										}
										else{
											var img_set = [];
											var state_set = [];
											var names_set = [];
											for(var i = 0;i<user_ratings.length;i++){
												names_set.push(user_ratings[i].park_name);
												getImg(user_ratings[i].park_name,img_set,function(){
													if(img_set.length==user_ratings.length&&names_set.length==user_ratings.length){
														state_stat(names_set,state_set,function(){
															res.render('profile',{email:user.email,lastname:user.last_name,firstname:user.first_name,profile_img:user.profile_img,session:"true",
																park_name:user_fav.park_name,user_ratings:user_ratings,weather_set:weather_set,img_set:img_set,state_set:state_set});
														});
													}
												});
											}
										}
									});
								}
							});
						}
					}
				});
			}
		});
	}
	else{
		res.redirect('/login');
	}
});
router.post('/profile',function(req,res,next){
	if(req.session&&req.session.user){
		if(req.body.type=="fav"){
			User_fav.findOne({email:req.session.user.email},function(err,user_fav){
				if(!user_fav);
				else{
					var new_park_name = [];
		  			var park_name = user_fav.park_name;
		  			if(park_name.length>1){
		  				for(var i = 0;i<park_name.length;i++){
		  					if(park_name[i]!=req.body.park_name)
		  						new_park_name.push(park_name[i]);
		  				}
		  				User_fav.findOneAndUpdate({email:req.session.user.email},{email:req.session.user.email,park_name:new_park_name},function(err){
							if(err){
								console.log(err);
							}
							res.redirect('/profile');
						});
		  			}
		  			else{
		  				User_fav.findOneAndRemove({email:req.session.user.email},function(err){
	  						if(err){
								console.log(err);
							}
							res.redirect('/profile');
	  					});
		  			}
				}
			});	
		}
		else if(req.body.type=="rating"){
			User_rating.findOneAndRemove({email:req.session.user.email,park_name:req.body.park_name},function(err){
				if(err){
					console.log(err);
				}
				console.log(req.body.park_name);
				res.redirect('/profile');
			});
		}
	}
	else{
		// mongoose.connection.close();
		res.redirect('/login');
	}
});

router.post('/profile/upload',upload.single('photo'),function(req,res){
	if(!req.file){
		res.redirect('/profile');
	}
	if(req.session&&req.session.user){
		User.findOne({email:req.session.user.email},function(err,user){
			if(err){
				console.log(err);
				res.redirect('/profile');
			}
			else{
				user.profile_img = req.file.path;
				user.save(function(err,user){
					if(err){
						console.log(err);
					}
					res.redirect('/profile');
				}) 
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
			res.render('login',{msg:"The user doesn't exist!",profile_img:""});
		}
		else{
			if(bcrypt.compareSync(req.body.password, user.password)){
				req.session.user = user;
				// mongoose.connection.close();
				res.redirect('/profile');
			}
			else{
				// mongoose.connection.close();
				res.render('login',{msg:"Password incorrect!",profile_img:""});
			}
		}
	});
});

router.post('/signup',function(req,res,next){
	var user = new User({
		first_name:req.body.firstname,
		last_name:req.body.lastname,
		email:req.body.email,
		password:bcrypt.hashSync(req.body.password),
		profile_img:""
	});
	user.save(function(err){
		if(err){
			var msg = "Something wrong happend, please try again.";
			if(err.code===11000){
				msg = "The email address has been registered.";
			}
			res.render('signup',{msg:msg,profile_img:""});
		}
		else
			res.redirect('/login');
	});
});

module.exports = router;
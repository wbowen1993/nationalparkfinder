var express = require('express');
var router = express.Router();
var request = require('request');
var https = require('https');
var mysql = require('mysql');
var Flickr = require("node-flickr");
var keys = {"api_key": "338ad28fc7b797a4836746d87db99105"}
flickr = new Flickr(keys);
var mongoose = require('mongoose');

var User = require('../model/user');

var Yelp = require('yelp');
var yelp = new Yelp({
  consumer_key: 'E_rk7aM7tlaNP6_EpP5OPw',
  consumer_secret: 'QsGNsJfZymc3YCHwXv0VxfH0Xiw',
  token: 'xLKAOVr6r0V-58xWtc2J161uklEmpO9v',
  token_secret: 'Nx96dUQJRosnDp7qSy_RZZE1vRQ',
});

var Twitter = require('twitter');
var client = new Twitter({
  consumer_key: '0Mp3W5F6BkTTvrviuQ5p6AZq6',
  consumer_secret: 'QqesrjGmEAm1FmoOn0iXebny9fD9TqbwYuJXHcLM5rOoq4tA0k',
  access_token_key: '3437158475-72fxPjQYTKY6NnptL8VBkdbs4ViTczw9poeTSbV',
  access_token_secret: 'BHq7H0sfpvbo2x73oYMwWRfgVb0V6dYiurFpHjGVpgjcw'
});

var User_fav = require('../model/user_fav');
var User_rating = require('../model/user_rating');

// mongoose.connect('mongodb://cis550:11111111@ds161630.mlab.com:61630/users');

var lat = [];
var lon = [];
var description = [];
var directions_info = [];
var profile_img = "";

// Connect string to MySQL
var connection = mysql.createConnection({
  host     : 'db-group8-mysql.cd4nksdzz6ad.us-east-1.rds.amazonaws.com',
  user     : 'adminUser',
  password : 'ThatsNotAPassword629451!', // This is not the correct password! Please enter your own.
  database : 'NationalParksMySql'
});

function mysqlQuery(park_name,lat,lon,description,directions_info,
        visitorCenter_name, visitorCenter_phone, visitorCenter_website, visitorCenter_lat, visitorCenter_long,
        usrActivity_name, usrActivity_type, usrActivity_descr, usrActivity_lat, usrActivity_long,
        park_alert_t,park_alert_d,park_caution_t,park_caution_d,
        restaurant_name,restaurant_rating,restaurant_address,restaurant_url,restaurant_lat,restaurant_lon,
        camp_names,camp_phones,camp_lat,camp_lon,weather,min_temperature,max_temperature,weather_code,time,humidity,sunrise,sunset,closest_name,closest_addr,closest_rating,closest_url,
        callback){
	lat.length = 0;
	lon.length = 0;
	description.length = 0;
	directions_info.length = 0;
	console.log(park_name);
	var query = "SELECT Id,description,latitude,longitude,directions_info FROM NationalPark WHERE name = '"+park_name+"';";
	connection.query(query, function(err, rows, fields) {
        if (err) console.log(err);
        else{
        	console.log(query);
        	var NpId = rows[0].Id;
	        lat.push(rows[0].latitude);
	        lon.push(rows[0].longitude);
	        description.push(rows[0].description);
	        directions_info.push(rows[0].directions_info);
        }
        query = "select description,code,date,sunrise_time,sunset_time,low_temperature,high_temperature,humidity from Weather where parkId ="+NpId+";";
        connection.query(query, function(err, rows, fields) {
            if (err) console.log(err);
            else{
            	for(var i = 0;i<rows.length;i++){
            		weather.push(rows[i].description);
            		weather_code.push(rows[i].code);
            		min_temperature.push(rows[i].low_temperature);
            		max_temperature.push(rows[i].high_temperature);
            		time.push((rows[i].date.toString()).substring(0,10));
            		humidity.push(rows[i].humidity);
            		sunrise.push((rows[i].sunrise_time.toString()).substring(0,5));
            		sunset.push((rows[i].sunset_time.toString()).substring(0,5));
            	}
            }
			query = "SELECT DISTINCT V.Name, V.Phone, V.Website, V.GPSLat, V.GPSLong FROM NationalPark np, VisitorCenter V WHERE V.NPId = " + NpId + ";";        
			connection.query(query, function(err, rows, fields) {
			    if (err) console.log(err);
			    else 
			    {
			        for(var i = 0;i<rows.length;i++)
			        {
			            visitorCenter_name.push(rows[i].Name);
			            visitorCenter_phone.push(rows[i].Phone);
			            visitorCenter_website.push(rows[i].Website);
			            visitorCenter_lat.push(rows[i].GPSLat);
			            visitorCenter_long.push(rows[i].GPSLong);
			        }
			    }

			    query = "SELECT DISTINCT A.Name, A.Type, A.Description, A.GPSLat, A.GPSLong FROM NationalPark np, Activities A WHERE A.NPId = " + NpId + " ORDER BY A.Type, A.Name;";
			    connection.query(query, function(err, rows, fields) {
			        if (err) console.log(err);
			        else 
			        {
			            for(var i = 0;i<rows.length;i++)
			            {
			                usrActivity_name.push(rows[i].Name);
			                usrActivity_type.push(rows[i].Type);
			                usrActivity_descr.push(rows[i].Description);
			                usrActivity_lat.push(rows[i].GPSLat);
			                usrActivity_long.push(rows[i].GPSLong);
			                //console.log("AName: " + rows[i].Name + "T:" + rows[i].Type + "D:" + rows[i].Description + "Lat:" + rows[i].GPSLat + "Long: " + rows[i].GPSLong);
			            }
			        }
			        query =  "SELECT * FROM Alert WHERE park_code = "+NpId+";";
			        connection.query(query, function(err, rows, fields) {
			            if (err) console.log(err);
			            else{
			                for(var i = 0;i<rows.length;i++)
			                {
			                    if(rows[i].category!="Caution"){
									park_alert_t.push(rows[i].title);
									park_alert_d.push(rows[i].description);
								}
								else{
									park_caution_t.push(rows[i].title);
									park_caution_d.push(rows[i].description);
								}
			                    //console.log("AName: " + rows[i].Name + "T:" + rows[i].Type + "D:" + rows[i].Description + "Lat:" + rows[i].GPSLat + "Long: " + rows[i].GPSLong);
			                }
			                query = "select name,address,latitude,longitude,rating,image_url from Business where park_id = "+NpId+";";
			                connection.query(query, function(err, rows, fields) {
					            if (err) console.log(err);
					            else{
					            	if(rows.length>5)
						                for(var i = 0;i<5;i++){
						                	if(rows[i].rating.toString().indexOf(".5")!=-1){
						                		var str = rows[i].rating.toString();
						                		// console.log(rows[i].rating);
						                		restaurant_rating.push("../img/yelp_rating/large_"+str[0].toString()+"_half.png");
						                	}
						                	else{
						                		var str =  rows[i].rating.toString();
						                		// console.log(str);
						                		restaurant_rating.push("../img/yelp_rating/large_"+str[0].toString()+".png");
						                	}
						                	restaurant_name.push(rows[i].name);
						                	restaurant_address.push(rows[i].address);
						                	restaurant_url.push(rows[i].image_url);
						                	restaurant_lat.push(rows[i].latitude);
						                	restaurant_lon.push(rows[i].longitude);
						                }
					                else
					                	for(var i = 0;i<rows.length;i++){
						                	if(rows[i].rating.toString().indexOf(".5")!=-1){
						                		var str = rows[i].rating.toString();
						                		restaurant_rating.push("../img/yelp_rating/large_"+str[0].toString()+"_half.png");
						                	}
						                	else{
						                		var str =  rows[i].rating.toString();
						                		restaurant_rating.push("../img/yelp_rating/large_"+str[0].toString()+".png");
						                	}
						                	restaurant_name.push(rows[i].name);
						                	restaurant_address.push(rows[i].address);
						                	restaurant_url.push(rows[i].image_url);
						                	restaurant_lat.push(rows[i].latitude);
						                	restaurant_lon.push(rows[i].longitude);
						                }
						            query = "select name,latitude,longitude,phone from Campground where parkCode = "+NpId+";";
					                connection.query(query, function(err, rows, fields) {
							            if (err) console.log(err);
							            else{
							            	console.log(query);
							            	for(var i = 0;i<rows.length;i++){
							            		camp_names.push(rows[i].name);
							            		camp_lat.push(rows[i].latitude);
							            		camp_lon.push(rows[i].longitude);
							            		camp_phones.push(rows[i].phone);
							            	}
							            	query = "DROP VIEW IF EXISTS vvvv;";
							            	connection.query(query, function(err, rows, fields) {
							            		if (err) console.log(err);
							            		else{	
								            		query = "CREATE VIEW vvvv AS (SELECT B.park_id, B.business_id, B.name, B.address, B.rating, B.image_url, B.longitude, B.latitude, V.GPSLong, V.GPSLat, MIN(sqrt((B.longitude - V.GPSLong)*(B.longitude - V.GPSLong) + (B.latitude - V.GPSLat)*(B.latitude - V.GPSLat))) AS distance FROM Business B INNER JOIN NationalPark P ON B.park_id = P.Id INNER JOIN VisitorCenter V ON P.Id = V.NPId GROUP BY B.park_id);";
								            		connection.query(query, function(err, rows, fields) {
								            			if (err) console.log(err);
								            			else{
								            				query = "SELECT name, address, rating, image_url FROM vvvv WHERE park_id = "+NpId+";";
									                		connection.query(query, function(err, rows, fields) {
									                			if (err) console.log(err);
											            		else{
											            			if(rows.length != 0) {
											            				closest_name.push(rows[0].name);
											            				closest_addr.push(rows[0].address);
											            				var str = rows[0].rating.toString();
											            				if(str.indexOf(".5")!=-1){
											            					closest_rating.push("../img/yelp_rating/large_"+str[0].toString()+"_half.png");
											            				} else {
										            						closest_rating.push("../img/yelp_rating/large_"+str[0].toString()+".png");
											            				}
											            				closest_url.push(rows[0].image_url);
									            						
									            					}
										            			}
										            			callback();
										            		});
									            		}
									            	});
						            			}	
											});
							            }
							        });
					            }
							});
			            }
			        });
			    });
			});
	    });
	});
}

function flickr_out(result,bgImg,callback){
	var owner = [];
	for(var i = 0;i<result.photos.photo.length;i++){
		if(owner.indexOf(result.photos.photo[i].owner)!=-1)
			continue;
		if(bgImg.length==3)
			break;
		var owner_temp = result.photos.photo[i].owner;
    	flickr.get("photos.getSizes", {"photo_id":result.photos.photo[i].id}, function(err, result1){
		    if (err) return console.error(err);
		    var temp_arr = result1.sizes.size;
		    for(var j = temp_arr.length-1;j>=0;j--){
				if(parseInt(temp_arr[j].width)>=1024&&temp_arr[j].label.indexOf('Large')!=-1&&
			    	(parseInt(temp_arr[j].width)/parseInt(temp_arr[j].height))>1.6&&
			    	(parseInt(temp_arr[j].width)/parseInt(temp_arr[j].height))<2){
					bgImg.push(temp_arr[j].source); 
					owner.push(owner_temp); 
					break;  	
			    }
		    }
	    });
	}
	callback();
}



router.get('/park/:park_name',function(req,res,next){
	console.log("param:"+req.params.park_name);
	var session = "false";
    var faved = "false";    
    var rated = "false";
    var scene = -1;
    var act = -1;
    var exp = -1;
    var date = "";
    var days = "";
    var tags = [];
	var key_words = req.params.park_name;
	decodeURI(key_words);

    if(req.session&&req.session.user){
      	session = "true";
      	User.findOne({email:req.session.user.email},function(err,user){
      		if(!user);
	        else{
	          profile_img = user.profile_img;
	        }
      	});
      	User_fav.findOne({email:req.session.user.email},function(err,user_fav){
      		if(!user_fav);
      		else{
      			if(user_fav.park_name.indexOf(key_words)!=-1)
	      			faved = "true";
      		}
      	});
      	User_rating.findOne({email:req.session.user.email,park_name:key_words},function(err,user_rating){
      		if(!user_rating);
      		else{
      			rated = "true";
      			scene = user_rating.scene_rating;
      			act = user_rating.act_rating;
      			exp = user_rating.exp_rating;
      			date = user_rating.date;
      			days = user_rating.days;
      			tags = user_rating.tag;
      		}
      	});
    }
    
    var visitorCenter_name = [];
    var visitorCenter_phone = [];
    var visitorCenter_website = [];
    var visitorCenter_lat = [];
    var visitorCenter_long = [];

    
    var usrActivity_name = [];
    var usrActivity_type = [];
    var usrActivity_descr = [];
    var usrActivity_lat = [];
    var usrActivity_long = [];

    
	var bgImg=[];
	var restaurant_name = [];
	var restaurant_rating = [];
	var restaurant_address = [];
	var restaurant_url = [];
	var restaurant_lat = [];
	var restaurant_lon = [];

	var weather = [];
	var weather_code = [];
	var min_temperature = [];
	var max_temperature = [];
	var time = [];
	var humidity = [];
	var sunrise = [];
	var sunset = [];

	var park_alert_t = [];
	var park_alert_d = [];
	var park_caution_t = [];
	var park_caution_d = [];

	var camp_names = [];
	var camp_phones = [];
	var camp_lat = [];
	var camp_lon = [];

	var closest_name = [];
	var closest_rating = [];
	var closest_url = [];
	var closest_addr = [];

	var t_text = [];
	var t_username = [];
	var t_screenname = [];
	var t_bng = [];
	var t_user_img = [];
	var t_img = [];
	
	var tweet_q = key_words;

	flickr.get("photos.search", {"text": key_words,"sort":"relevance","per_page":200,"page":1,"min_taken_date":"2015-01-01"}, function(err, result){
	    if (err) return console.error(err);
	    flickr_out(result,bgImg,function(){
	    	mysqlQuery(key_words,lat,lon,description,directions_info,
		        visitorCenter_name, visitorCenter_phone, visitorCenter_website, visitorCenter_lat, visitorCenter_long,
		        usrActivity_name, usrActivity_type, usrActivity_descr, usrActivity_lat, usrActivity_long,
		        park_alert_t,park_alert_d,park_caution_t,park_caution_d,
		        restaurant_name,restaurant_rating,restaurant_address,restaurant_url,restaurant_lat,restaurant_lon,
		        camp_names,camp_phones,camp_lat,camp_lon,weather,min_temperature,max_temperature,weather_code,time,humidity,sunrise,sunset,closest_name,closest_addr,closest_rating,closest_url,
		        function(){
	        		client.get('search/tweets', {q: tweet_q,count:500}, function(error, tweets, response) {
						var count = 0;
						for(var i = 0;i<tweets.statuses.length;i++){
							if(count==5)
								break;
							var arr = tweets.statuses[i];
							// console.log(arr.text+"-------"+arr.user.name);
							if(arr.entities.media!=undefined){
								var media = arr.entities.media;
								if(media[0].type=="photo"){
									count++;
									t_text.push(arr.text);
									t_img.push(media[0].media_url);
									t_username.push(arr.user.name);
									t_screenname.push(arr.user.screen_name);
									t_bng.push(arr.user.profile_banner_url);
									t_user_img.push(arr.user.profile_image_url);
								}
							}
						}
						res.render('park',{key_words:key_words,bgImg:bgImg,t_text:t_text,t_username:t_username,t_screenname:t_screenname,t_bng:t_bng,t_user_img:t_user_img,t_img:t_img,
				    		time:time,weather:weather,humidity:humidity,min_temperature:min_temperature,max_temperature:max_temperature,weather_code:weather_code,sunrise:sunrise,sunset:sunset,
				    		restaurant_name:restaurant_name,restaurant_rating:restaurant_rating,restaurant_address:restaurant_address,restaurant_url:restaurant_url,restaurant_lat:restaurant_lat,restaurant_lon:restaurant_lon,
				    		park_alert_t:park_alert_t,park_alert_d:park_alert_d,park_caution_t:park_caution_t,park_caution_d:park_caution_d,
					    	lat:lat[0],lon:lon[0],description:description[0],directions_info:directions_info[0],
						    visitorCenter_name:visitorCenter_name, visitorCenter_phone:visitorCenter_phone, visitorCenter_website:visitorCenter_website, visitorCenter_lat:visitorCenter_lat, visitorCenter_long:visitorCenter_long,
		                    usrActivity_name:usrActivity_name, usrActivity_type:usrActivity_type, usrActivity_descr:usrActivity_descr,usrActivity_lat:usrActivity_lat,usrActivity_long:usrActivity_long,
		                    camp_names:camp_names,camp_phones:camp_phones,camp_lat:camp_lat,camp_lon:camp_lon,
		                    closest_name:closest_name,closest_rating:closest_rating,closest_url:closest_url,closest_addr:closest_addr,session:session,faved:faved,rated:rated,scene:scene,act:act,exp:exp,date:date,days:days,tags:tags,profile_img:profile_img});
					});
	        });
		});
	});
});

router.post('/park/:park_name',function(req,res,next){
	var key_words = req.params.park_name;
	decodeURI(key_words);
    if(req.session&&req.session.user){
    	if(req.body.operation=="fav"){
    		User_fav.findOne({email:req.session.user.email},function(err,user_fav){
		      	if(!user_fav){
		      		var park_name = [];
		      		park_name.push(key_words);
					var user_fav = new User_fav({
						email:req.session.user.email,
						park_name:park_name
					});
					user_fav.save(function(err){
						if(err){
							console.log(err);
						}
						res.redirect('/park/'+req.params.park_name);
					});
		      	}
		  		else{
		  			var park_name = user_fav.park_name;
		  			console.log(user_fav.park_name+"-----"+key_words);
		  			if(park_name.indexOf(key_words)!=-1){
		  				if(park_name.length==1){
		  					User_fav.findOneAndRemove({email:req.session.user.email},function(err){
		  						if(err){
									console.log(err);
								}
								res.redirect('/park/'+req.params.park_name);
		  					});
		  				}
	  					else{
	  						var new_park_name = [];
			  				for(var i = 0;i<park_name.length;i++){
			  					if(park_name[i]!=key_words)
			  						new_park_name.push(park_name[i]);
			  				}
			  				User_fav.findOneAndUpdate({email:req.session.user.email},{email:req.session.user.email,park_name:new_park_name},function(err){
		  						if(err){
									console.log(err);
								}
								res.redirect('/park/'+req.params.park_name);
		  					});
	  					}
		  			}
		  			else{
		  				park_name.push(key_words);
		  				console.log(park_name);
		  				User_fav.findOneAndUpdate({email:req.session.user.email},{
		  					email:req.session.user.email,
		  					park_name:park_name},function(err){
	  						if(err){
								console.log(err);
							}
							res.redirect('/park/'+req.params.park_name);
	  					});
		  			}
		  		}
	      	});
    	}
      	else{
      		User_rating.findOne({email:req.session.user.email,park_name:key_words},function(err,user_rating){
      			if(!user_rating){
      				var tags = (req.body.tag).split(";");
      				var user_rating = new User_rating({
      					email:req.session.user.email,
      					park_name:key_words,
      					scene_rating:req.body.scene,
						act_rating:req.body.act,
						exp_rating:req.body.exp,
						date:req.body.date,
						days:req.body.days,
						tag:tags
      				});
					user_rating.save(function(err){
						if(err){
							console.log(err);
						}
						res.redirect('/park/'+req.params.park_name);
					});
      			}
      			else{
      				var tags = (req.body.tag).split(";");
      				if(tags.length==1&&tags[0]=="")
      					tags = [];
      				User_rating.findOneAndUpdate({email:req.session.user.email,park_name:key_words},{
      					email:req.session.user.email,
      					park_name:key_words,
      					scene_rating:req.body.scene,
						act_rating:req.body.act,
						exp_rating:req.body.exp,
						date:req.body.date,
						days:req.body.days,
						tag:tags
      				},function(err){
						if(err){
							console.log(err);
						}
						res.redirect('/park/'+req.params.park_name);
					});
      			}
      		});
      	}
    }
    else{
    	res.redirect('/login');
    }
});



module.exports = router;
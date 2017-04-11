var express = require('express');
var router = express.Router();
var request = require('request');
var https = require('https');
var mysql = require('mysql');
var Flickr = require("node-flickr");
var keys = {"api_key": "338ad28fc7b797a4836746d87db99105"}
flickr = new Flickr(keys);
var fs = require('fs');

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

var lat = [];
var lon = [];
var description = [];
var directions_info = [];

// Connect string to MySQL
var connection = mysql.createConnection({
  host     : 'db-group8-mysql.cd4nksdzz6ad.us-east-1.rds.amazonaws.com',
  user     : 'adminUser',
  password : 'yourPassword986274', // This is not the correct password! Please enter your own.
  database : 'NationalParksMySql'
});

function mysqlQuery(park_name,lat,lon,description,directions_info,
        visitorCenter_name, visitorCenter_phone, visitorCenter_website, visitorCenter_lat, visitorCenter_long,
        usrActivity_name, usrActivity_type, usrActivity_descr, usrActivity_lat, usrActivity_long,
        park_alert_t,park_alert_d,park_caution_t,park_caution_d,
        restaurant_name,restaurant_rating,restaurant_address,restaurant_url,restaurant_lat,restaurant_lon,
        camp_names,camp_phones,camp_lat,camp_lon,
        callback)
{
	var query = "SELECT Id,description,latitude,longitude,directions_info FROM NationalPark WHERE name = '"+park_name+"';";
	connection.query(query, function(err, rows, fields) {
        if (err) console.log(err);
        else{
        	var NpId = rows[0].Id;
	        lat.push(rows[0].latitude);
	        lon.push(rows[0].longitude);
	        description.push(rows[0].description);
	        directions_info.push(rows[0].directions_info);
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
						            	for(var i = 0;i<rows.length;i++){
						            		camp_names.push(rows[i].name);
						            		camp_lat.push(rows[i].latitude);
						            		camp_lon.push(rows[i].longitude);
						            		camp_phones.push(rows[i].phone);
						            	}
										callback();
						            }
						        });
				            }
						});
		            }
		        });
		    });
	    });
	});
}

function weather_collect(weather,min_temperature,max_temperature,weather_code,time,humidity,sunrise,sunset,callback){
	weather_url = "http://api.apixu.com/v1/forecast.json?key=1910d08aadc74902bd950044172202&days=5&q="+lat+","+lon;
	request({
	    url: weather_url,
	    json: true
	}, function (error, response, body) {
	    if (!error && response.statusCode === 200) {
	    	for(var i =0;i<5;i++){
		        var temp_weather = body["forecast"]["forecastday"][i]["day"]["condition"]["text"];
		        var temp_weather_code = body["forecast"]["forecastday"][i]["day"]["condition"]["icon"];
		        var temp_time = body["forecast"]["forecastday"][i]["date"];
		        var temp_humidity = body["forecast"]["forecastday"][i]["day"]["avghumidity"]+"%";
		        weather.push(temp_weather);
		        humidity.push(temp_humidity);
		        weather_code.push(temp_weather_code);
		        time.push(temp_time.substring(5,10));
		        sunrise.push(body["forecast"]["forecastday"][i]["astro"]["sunrise"]);
		        sunset.push(body["forecast"]["forecastday"][i]["astro"]["sunset"]);
		        var temp_min_temperature=body["forecast"]["forecastday"][i]["day"]["mintemp_f"];
		        var temp_max_temperature=body["forecast"]["forecastday"][i]["day"]["maxtemp_f"];
		        temp_min_temperature = temp_min_temperature.toString();
		        temp_max_temperature = temp_max_temperature.toString();
		        temp_min_temperature+="° F";
		        temp_max_temperature+="° F";
		        min_temperature.push(temp_min_temperature);
		        max_temperature.push(temp_max_temperature);
		    }	    
			callback();
	    }
	});
};

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
	var key_words = req.params.park_name;
	decodeURI(key_words);
    
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
    var weather_info = [];
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

	var t_text = [];
	var t_username = [];
	var t_screenname = [];
	var t_bng = [];
	var t_user_img = [];
	var t_img = [];
	
	var tweet_q = key_words;
	client.get('search/tweets', {q: tweet_q,count:1000}, function(error, tweets, response) {
		var count = 0;
		for(var i = 0;i<tweets.statuses.length;i++){
			if(count==5)
				break;
			var arr = tweets.statuses[i];
			console.log(arr.text+"-------"+arr.user.name);
			if(arr.entities.media!=undefined){
				var media = arr.entities.media;
				if(media[0].type=="photo"){
					if(t_img.indexOf(media[0].media_url)==-1){
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
		}
	});
    
     mysqlQuery(key_words,lat,lon,description,directions_info,
        visitorCenter_name, visitorCenter_phone, visitorCenter_website, visitorCenter_lat, visitorCenter_long,
        usrActivity_name, usrActivity_type, usrActivity_descr, usrActivity_lat, usrActivity_long,
        park_alert_t,park_alert_d,park_caution_t,park_caution_d,
        restaurant_name,restaurant_rating,restaurant_address,restaurant_url,restaurant_lat,restaurant_lon,
        camp_names,camp_phones,camp_lat,camp_lon,
        function(){
			flickr.get("photos.search", {"text": key_words,"sort":"relevance","per_page":200,"page":1,"min_taken_date":"2015-01-01"}, function(err, result){
			    if (err) return console.error(err);
		        flickr_out(result,bgImg,function(){
		 			weather_collect(weather,min_temperature,max_temperature,weather_code,time,humidity,sunrise,sunset,function(){
			    		res.render('park',{key_words:key_words,bgImg:bgImg,t_text:t_text,t_username:t_username,t_screenname:t_screenname,t_bng:t_bng,t_user_img:t_user_img,t_img:t_img,
			    		time:time,weather:weather,humidity:humidity,min_temperature:min_temperature,max_temperature:max_temperature,weather_code:weather_code,sunrise:sunrise,sunset:sunset,
			    		restaurant_name:restaurant_name,restaurant_rating:restaurant_rating,restaurant_address:restaurant_address,restaurant_url:restaurant_url,restaurant_lat:restaurant_lat,restaurant_lon:restaurant_lon,
			    		park_alert_t:park_alert_t,park_alert_d:park_alert_d,park_caution_t:park_caution_t,park_caution_d:park_caution_d,
				    	lat:lat[0],lon:lon[0],description:description[0],directions_info:directions_info[0],
					    visitorCenter_name:visitorCenter_name, visitorCenter_phone:visitorCenter_phone, visitorCenter_website:visitorCenter_website, visitorCenter_lat:visitorCenter_lat, visitorCenter_long:visitorCenter_long,
                        usrActivity_name:usrActivity_name, usrActivity_type:usrActivity_type, usrActivity_descr:usrActivity_descr,usrActivity_lat:usrActivity_lat,usrActivity_long:usrActivity_long,
                        camp_names:camp_names,camp_phones:camp_phones,camp_lat:camp_lat,camp_lon:camp_lon});
				    });
		        });
			});
	    });
});

module.exports = router;
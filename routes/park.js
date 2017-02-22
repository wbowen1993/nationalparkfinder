var express = require('express');
var router = express.Router();
var request = require('request');
var https = require('https');
var MongoClient = require('mongodb').MongoClient;
var Flickr = require("node-flickr");
var keys = {"api_key": "338ad28fc7b797a4836746d87db99105"}
flickr = new Flickr(keys);
var Yelp = require('yelp');
var yelp = new Yelp({
  consumer_key: 'E_rk7aM7tlaNP6_EpP5OPw',
  consumer_secret: 'QsGNsJfZymc3YCHwXv0VxfH0Xiw',
  token: 'xLKAOVr6r0V-58xWtc2J161uklEmpO9v',
  token_secret: 'Nx96dUQJRosnDp7qSy_RZZE1vRQ',
});


var park_name = [];
var park_name1 = [];
var latitude = [];
var longitude = [];
var desc = [];
var lat;
var lon;
var description;

function link_db(park_name,latitude,longitude,park_name1,desc,callback){
	MongoClient.connect("mongodb://wbowen:11111111@ds147599.mlab.com:47599/national_park", function(err, db) {
	  	if(!err) {
		    console.log("We are connected database: national_park!");
		    var collection = db.collection('park_info_from_WIKI');
		    var collection1 = db.collection('park_info_from_RIDB');
		    collection.find().toArray(function(err, items) {
		        if(!err){
		        	for(var i = 0;i<items.length;i++){
			             park_name.push(items[i]["name"]);
			             latitude.push(items[i]["latitude"]);
			             longitude.push(items[i]["longitude"]);
		        	}
			    }            
		    });
		    collection1.find().toArray(function(err, items) {
		        if(!err){
		        	for(var i = 0;i<items[0]["table"].length;i++){
			             park_name1.push(items[0]["table"][i]["name"]);
			             desc.push(items[0]["table"][i]["description"]);
					}
		        	callback();
		        }            
		    });
	  	}
	});
}

router.get('/park/:park_name',function(req,res,next){
	var key_words = req.params.park_name;
	decodeURI(key_words);
	var bgImg=[];
	var restaurant_name = [];
	var restaurant_rating = [];
	var restaurant_address = [];
	var restaurant_url = [];
	var bar_name = [];
	var bar_rating = [];
	var bar_address = [];
	var bar_url = [];

	var weather = [];
	var weather_code = [];
	var min_temperature = [];
	var max_temperature = [];
	var time = [];
	var humidity = [];
	var sunrise = [];
	var sunset = [];
	link_db(park_name,latitude,longitude,park_name1,desc,function(){
    	for(var i = 0;i<park_name.length;i++){
    		if(park_name[i]==key_words){
    			lat = latitude[i];
    			lon = longitude[i];
    			break;
    		}
    	}
    	for(var i = 0;i<park_name1.length;i++){
    		if(park_name1[i]==key_words){
    			description = desc[i];
    			break;
    		}
    	}
	});
	
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
	function yelp_r_collect(restaurant_name,restaurant_rating,restaurant_address,restaurant_url,callback){	
		yelp.search({ term: 'restaurant', 
			ll: lat+","+lon,
			sort:0,
			limit:6
		})
		.then(function (data) {
		    for(var i = 0;i<5;i++){
				restaurant_name.push(data["businesses"][i]["name"]);
				restaurant_rating.push(data["businesses"][i]["rating_img_url_large"]);
				restaurant_address.push(data["businesses"][i]["location"]["address"]);
				restaurant_url.push(data["businesses"][i]["image_url"]);
			}
			callback();
		})
		.catch(function (err) {
		  console.error(err);
		});
	};
	function yelp_b_collect(bar_name,bar_rating,bar_address,bar_url,callback){	
		yelp.search({ term: 'bar', 
			ll: lat+","+lon,
			sort:0
		})
		.then(function (data) {
			console.log(lat);
		    console.log(lon);
			for(var i = 0;i<5;i++){
				bar_name.push(data["businesses"][i]["name"]);
				bar_rating.push(data["businesses"][i]["rating_img_url_large"]);
				bar_address.push(data["businesses"][i]["location"]["address"]);
				bar_url.push(data["businesses"][i]["image_url"]);
			}
			callback();
		})
		.catch(function (err) {
		  console.error(err);
		});
	};
	flickr.get("photos.search", {"text": key_words,"sort":"interestingness-desc","per_page":5,"page":1,"min_taken_date":"2016-01-01","in_gallery":true}, function(err, result){
	    if (err) return console.error(err);
	    var index = 1;
	    var counter = 0;
	        flickr.get("photos.getSizes", {"photo_id":result.photos.photo[index].id}, function(err, result1){
			    if (err) return console.error(err);
			    var temp_arr = result1.sizes.size;
			    index++;
			    bgImg.push(temp_arr[temp_arr.length-1].source);
				if(index==4){
		    		weather_collect(weather,min_temperature,max_temperature,weather_code,time,humidity,sunrise,sunset,function(){
					    yelp_r_collect(restaurant_name,restaurant_rating,restaurant_address,restaurant_url,function(){
					    	yelp_b_collect(bar_name,bar_rating,bar_address,bar_url,function(){
					    		res.render('park',{key_words:key_words,bgImg:bgImg,
					    		time:time,weather:weather,humidity:humidity,min_temperature:min_temperature,max_temperature:max_temperature,weather_code:weather_code,sunrise:sunrise,sunset:sunset,
					    		restaurant_name:restaurant_name,restaurant_rating:restaurant_rating,restaurant_address:restaurant_address,restaurant_url:restaurant_url,
					    		bar_name:bar_name,bar_rating:bar_rating,bar_address:bar_address,bar_url:bar_url,
						    	lat:lat,lon:lon,description:description});
					    	});	
					    });
				    });
		    	}
			});
			flickr.get("photos.getSizes", {"photo_id":result.photos.photo[index+1].id}, function(err, result1){
			    if (err) return console.error(err);
			    var temp_arr = result1.sizes.size;
			    bgImg.push(temp_arr[temp_arr.length-1].source);
			    index++;
				if(index==4){
		    		weather_collect(weather,min_temperature,max_temperature,weather_code,time,humidity,sunrise,sunset,function(){
					    yelp_r_collect(restaurant_name,restaurant_rating,restaurant_address,restaurant_url,function(){
					    	yelp_b_collect(bar_name,bar_rating,bar_address,bar_url,function(){
					    		res.render('park',{key_words:key_words,bgImg:bgImg,
					    		time:time,weather:weather,humidity:humidity,min_temperature:min_temperature,max_temperature:max_temperature,weather_code:weather_code,sunrise:sunrise,sunset:sunset,
					    		restaurant_name:restaurant_name,restaurant_rating:restaurant_rating,restaurant_address:restaurant_address,restaurant_url:restaurant_url,
					    		bar_name:bar_name,bar_rating:bar_rating,bar_address:bar_address,bar_url:bar_url,
						    	lat:lat,lon:lon,description:description});
					    	});	
					    });
				    });
		    	}
			});
			flickr.get("photos.getSizes", {"photo_id":result.photos.photo[index-1].id}, function(err, result1){
			    if (err) return console.error(err);
			    var temp_arr = result1.sizes.size;
			    bgImg.push(temp_arr[temp_arr.length-1].source);
			    index++;
				if(index==4){
		    		weather_collect(weather,min_temperature,max_temperature,weather_code,time,humidity,sunrise,sunset,function(){
					    yelp_r_collect(restaurant_name,restaurant_rating,restaurant_address,restaurant_url,function(){
					    	yelp_b_collect(bar_name,bar_rating,bar_address,bar_url,function(){
					    		res.render('park',{key_words:key_words,bgImg:bgImg,
					    		time:time,weather:weather,humidity:humidity,min_temperature:min_temperature,max_temperature:max_temperature,weather_code:weather_code,sunrise:sunrise,sunset:sunset,
					    		restaurant_name:restaurant_name,restaurant_rating:restaurant_rating,restaurant_address:restaurant_address,restaurant_url:restaurant_url,
					    		bar_name:bar_name,bar_rating:bar_rating,bar_address:bar_address,bar_url:bar_url,
						    	lat:lat,lon:lon,description:description});
					    	});	
					    });
				    });
		    	}
			});
	});
});

module.exports = router;
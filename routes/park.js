var express = require('express');
var router = express.Router();
var request = require('request');
var https = require('https');
var MongoClient = require('mongodb').MongoClient;
var Flickr = require("node-flickr");
var keys = {"api_key": "338ad28fc7b797a4836746d87db99105"}
flickr = new Flickr(keys);
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var fs = require('fs');
// var fs = require('fs');
var Yelp = require('yelp');
var yelp = new Yelp({
  consumer_key: 'E_rk7aM7tlaNP6_EpP5OPw',
  consumer_secret: 'QsGNsJfZymc3YCHwXv0VxfH0Xiw',
  token: 'xLKAOVr6r0V-58xWtc2J161uklEmpO9v',
  token_secret: 'Nx96dUQJRosnDp7qSy_RZZE1vRQ',
});
var mysql = require('mysql');
var connection = mysql.createConnection({
	host : 'localhost',
	user : 'root',
	password : 'w773980',
	database : 'npfinder'
});

var park_names = [];
var directions_infos = [];
var latitude = [];
var longitude = [];
var desc = [];
var park_codes = [];
var lat;
var lon;
var description;
var directions_info;
var park_code;

function link_db(park_names,latitude,longitude,desc,directions_infos,park_codes,callback){
	MongoClient.connect("mongodb://wbowen:11111111@ds147599.mlab.com:47599/national_park", function(err, db) {
	  	if(!err) {
		    console.log("We are connected database: national_park!");
		    var collection = db.collection('all_parks_info');
		    collection.find().toArray(function(err, items) {
		        if(!err){
		        	for(var i = 0;i<items.length;i++){
		        		park_names.push(items[i]["name"]);
						latitude.push(items[i]["latitude"]);
						longitude.push(items[i]["longitude"]);
						desc.push(items[i]["description"]);
						directions_infos.push(items[i]["directions_info"]);
						park_codes.push(items[i]["park_code"]);
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
	var r_lat = [];
	var r_lon = [];
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

	var park_alert_t = [];
	var park_alert_d = [];
	var park_caution_t = [];
	var park_caution_d = [];
	
	link_db(park_names,latitude,longitude,desc,directions_infos,park_codes,function(){
    	for(var i = 0;i<park_names.length;i++){
    		if(park_names[i]==key_words){
    			lat = latitude[i];
    			lon = longitude[i];
				description = desc[i];
				directions_info = directions_infos[i];
				park_code = park_codes[i];
    			break;
    		}
    	}
		var url = "https://developer.nps.gov/api/v0/alerts?parkCode="+park_code;
		var item = new Object();
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open('GET',url,false);
		xmlhttp.setRequestHeader("Authorization", "FD95430A-AA83-4095-AA31-C1C5A8DA02FF");
		xmlhttp.send(null);

		console.log(url+":"+xmlhttp.status);
		if(xmlhttp.status===200){
			item = JSON.parse(xmlhttp.responseText);
			for(var i = 0;i<item["total"];i++){
				if(item["data"][i]["category"]!="Caution"){
					park_alert_t.push(item["data"][i]["title"]);
					park_alert_d.push(item["data"][i]["description"]);
				}
				else{
					park_caution_t.push(item["data"][i]["title"]);
					park_caution_d.push(item["data"][i]["description"]);
				}
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
	function yelp_r_collect(restaurant_name,restaurant_rating,restaurant_address,restaurant_url,r_lat,r_lon,callback){
		var query = "SELECT b.name AS name,address,b.latitude AS lat,b.longitude AS lon,rating_img,img FROM business b inner join nationalpark n on n.Id=b.parkCode where n.name='"+key_words+"'";
		connection.query(query, function(err, rows, fields) {
			if (err) console.log(err);
			else {
				if(rows.length>5)
					for(var i = 0;i<5;i++){
						restaurant_name.push(rows[i].name);
						restaurant_rating.push(rows[i].rating_img);
						restaurant_address.push(rows[i].address);
						restaurant_url.push(rows[i].img);
						r_lat.push(rows[i].lat);
						r_lon.push(rows[i].lon);		
					}
				else
					for(var i = 0;i<rows.length;i++){
						restaurant_name.push(rows[i].name);
						restaurant_rating.push(rows[i].rating_img);
						restaurant_address.push(rows[i].address);
						restaurant_url.push(rows[i].img);
						r_lat.push(rows[i].lat);
						r_lon.push(rows[i].lon);		
					}
				callback();
			}
		});	
	}
	function yelp_b_collect(bar_name,bar_rating,bar_address,bar_url,callback){	
		yelp.search({ term: 'bar', 
			ll: lat+","+lon,
			sort:0
		})
		.then(function (data) {
			for(var i = 0;i<5;i++){
				if(data["businesses"][i]==undefined)
					break;
				bar_name.push(data["businesses"][i]["name"]);
				bar_rating.push(data["businesses"][i]["rating_img_url_large"]);
				bar_address.push(data["businesses"][i]["location"]["display_address"]);
				bar_url.push(data["businesses"][i]["image_url"]);
			}
			callback();
		})
		.catch(function (err) {
		  console.error(err);
		});
	};
	flickr.get("photos.search", {"text": key_words,"sort":"relevance","per_page":200,"page":1,"min_taken_date":"2015-01-01"}, function(err, result){
	    if (err) return console.error(err);
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
        flickr_out(result,bgImg,function(){
 			console.log(park_code);
    		weather_collect(weather,min_temperature,max_temperature,weather_code,time,humidity,sunrise,sunset,function(){
			    yelp_r_collect(restaurant_name,restaurant_rating,restaurant_address,restaurant_url,r_lat,r_lon,function(){
			    	yelp_b_collect(bar_name,bar_rating,bar_address,bar_url,function(){
			    		res.render('park',{key_words:key_words,bgImg:bgImg,
			    		time:time,weather:weather,humidity:humidity,min_temperature:min_temperature,max_temperature:max_temperature,weather_code:weather_code,sunrise:sunrise,sunset:sunset,
			    		restaurant_name:restaurant_name,restaurant_rating:restaurant_rating,restaurant_address:restaurant_address,restaurant_url:restaurant_url,r_lat:r_lat,r_lon:r_lon,
			    		bar_name:bar_name,bar_rating:bar_rating,bar_address:bar_address,bar_url:bar_url,park_alert_t:park_alert_t,park_alert_d:park_alert_d,park_caution_t:park_caution_t,
				    	park_caution_d:park_caution_d,lat:lat,lon:lon,description:description,directions_info:directions_info});
			    	});	
			    });
		    });
        });
	});
});

module.exports = router;
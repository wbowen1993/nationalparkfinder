var express = require('express');
var router = express.Router();
var request = require('request');
var https = require('https');
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
var restaurant = [];
var weather = [];
var weather_code = [];
var min_temperature = [];
var max_temperature = [];
var time = [];
var wind = [];

router.get('/park/:park_name',function(req,res,next){
	var key_words = req.params.park_name;
	decodeURI(key_words);
	key_words+=" national park";
    var bgImg=[];
    var weather_url="http://api.openweathermap.org/data/2.5/forecast?APPID=e2724c27cfc2e499b0408cd890bdbef4&q="+key_words;
	function weather_collect(weather,min_temperature,max_temperature,weather_code,time,wind,callback){
		request({
		    url: weather_url,
		    json: true
		}, function (error, response, body) {
		    if (!error && response.statusCode === 200) {
	         	var length = body["list"].length;
		        for(var i =0;i<5;i++){
			        var temp_weather = body["list"][8*i]["weather"][0]["description"];
			        var temp_weather_code = body["list"][8*i]["weather"][0]["icon"];
			        var temp_time = body["list"][8*i]["dt_txt"];
			        var temp_wind_speed = body["list"][8*i]["wind"]["speed"];
			        var temp_wind_deg = body["list"][8*i]["wind"]["deg"];
			        if(temp_wind_deg>348.75||temp_wind_deg<=11.25)
			        	wind.push("N "+temp_wind_speed+" km/h");
    		        else if(temp_wind_deg>11.25&&temp_wind_deg<=33.75)
			        	wind.push("NNE "+temp_wind_speed+" km/h");
			        else if(temp_wind_deg>33.75&&temp_wind_deg<=56.25)
			        	wind.push("NE "+temp_wind_speed+" km/h");
			        else if(temp_wind_deg>56.25&&temp_wind_deg<=78.75)
			        	wind.push("ENE "+temp_wind_speed+" km/h");
			        else if(temp_wind_deg>78.75&&temp_wind_deg<=101.25)
			        	wind.push("E "+temp_wind_speed+" km/h");
			        else if(temp_wind_deg>101.25&&temp_wind_deg<=123.75)
			        	wind.push("ESE "+temp_wind_speed+" km/h");
			        else if(temp_wind_deg>123.75&&temp_wind_deg<=146.25)
			        	wind.push("SE "+temp_wind_speed+" km/h");
			        else if(temp_wind_deg>146.25&&temp_wind_deg<=168.75)
			        	wind.push("SSE "+temp_wind_speed+" km/h");
			        else if(temp_wind_deg>168.75&&temp_wind_deg<=191.25)
			        	wind.push("S "+temp_wind_speed+" km/h");
			        else if(temp_wind_deg>191.25&&temp_wind_deg<=213.75)
			        	wind.push("SSW "+temp_wind_speed+" km/h");
			        else if(temp_wind_deg>213.75&&temp_wind_deg<=236.25)
			        	wind.push("SW "+temp_wind_speed+" km/h");
			        else if(temp_wind_deg>236.25&&temp_wind_deg<=258.75)
			        	wind.push("WSW "+temp_wind_speed+" km/h");
			        else if(temp_wind_deg>258.75&&temp_wind_deg<=281.25)
			        	wind.push("W "+temp_wind_speed+" km/h");
			        else if(temp_wind_deg>281.25&&temp_wind_deg<=303.75)
			        	wind.push("WNW "+temp_wind_speed+" km/h");
			        else if(temp_wind_deg>303.75&&temp_wind_deg<=326.25)
			        	wind.push("NW "+temp_wind_speed+" km/h");
			        else
			        	wind.push("NNW "+temp_wind_speed+" km/h");
			        temp_weather_code = "http://openweathermap.org/img/w/"+temp_weather_code+".png";
			        weather.push(temp_weather);
			        weather_code.push(temp_weather_code);
			        time.push(temp_time.substring(5,10));
			        var temp_min_temperature=700;
			        var temp_max_temperature=-700;
			        if(i<4){
			        	for(var j=8*i;j<8*(i+1);j++){
			        		var temp = body["list"][j]["main"]["temp_min"];
					        temp = (temp - 273.15)* 1.8000 + 32.00;
					        temp = parseInt(temp.toString());
			        		temp_min_temperature = Math.min(temp_min_temperature,temp);
			        	}
			        	for(var j=8*i;j<8*(i+1);j++){
			        		var temp = body["list"][j]["main"]["temp_max"];
					        temp = (temp - 273.15)* 1.8000 + 32.00;
					        temp = parseInt(temp.toString());
			        		temp_max_temperature = Math.max(temp_max_temperature,temp);
			        	}
			        }
			        else{
				        for(var j=32;j<length;j++){
			        		var temp = body["list"][j]["main"]["temp_min"];
					        temp = (temp - 273.15)* 1.8000 + 32.00;
					        temp = parseInt(temp.toString());
			        		temp_min_temperature = Math.min(temp_min_temperature,temp);
			        	}
			        	for(var j=32;j<length;j++){
			        		var temp = body["list"][j]["main"]["temp_max"];
					        temp = (temp - 273.15)* 1.8000 + 32.00;
					        temp = parseInt(temp.toString());
			        		temp_max_temperature = Math.max(temp_max_temperature,temp);
			        	}	
			        }
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
	flickr.get("photos.search", {"text": key_words,"sort":"interestingness-desc","per_page":5,"page":1,"min_taken_date":"2016-01-01","in_gallery":true}, function(err, result){
	    if (err) return console.error(err);
	    // console.log(result.photos);
	    var index = 1;
	    var counter = 0;
	    // while(index<3){
	        flickr.get("photos.getSizes", {"photo_id":result.photos.photo[index].id}, function(err, result1){
			    if (err) return console.error(err);
			    var temp_arr = result1.sizes.size;
			    index++;
			    bgImg.push(temp_arr[temp_arr.length-1].source);
				if(index==4){
		    		weather_collect(weather,min_temperature,max_temperature,weather_code,time,wind,function(){
					    res.render('park',{key_words:key_words,bgImg:bgImg,time:time,weather:weather,wind:wind,min_temperature:min_temperature,max_temperature:max_temperature,weather_code:weather_code});
					});
		    	}
			});
			flickr.get("photos.getSizes", {"photo_id":result.photos.photo[index+1].id}, function(err, result1){
			    if (err) return console.error(err);
			    var temp_arr = result1.sizes.size;
			    bgImg.push(temp_arr[temp_arr.length-1].source);
			    index++;
				if(index==4){
		    		weather_collect(weather,min_temperature,max_temperature,weather_code,time,wind,function(){
					    res.render('park',{key_words:key_words,bgImg:bgImg,time:time,weather:weather,wind:wind,min_temperature:min_temperature,max_temperature:max_temperature,weather_code:weather_code});
					});
		    	}
			});
			flickr.get("photos.getSizes", {"photo_id":result.photos.photo[index-1].id}, function(err, result1){
			    if (err) return console.error(err);
			    var temp_arr = result1.sizes.size;
			    bgImg.push(temp_arr[temp_arr.length-1].source);
			    index++;
				if(index==4){
		    		weather_collect(weather,min_temperature,max_temperature,weather_code,time,wind,function(){
					    res.render('park',{key_words:key_words,bgImg:bgImg,time:time,weather:weather,wind:wind,min_temperature:min_temperature,max_temperature:max_temperature,weather_code:weather_code});
					});
		    	}
			});
	});
	// yelp.search({ term: 'food', location: key_words })
	// 	.then(function (data) {
	// 	  console.log(data);
	// 	})
	// 	.catch(function (err) {
	// 	  console.error(err);
	// 	});
});

module.exports = router;
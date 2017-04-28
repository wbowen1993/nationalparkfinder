var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'db-group8-mysql.cd4nksdzz6ad.us-east-1.rds.amazonaws.com',
  user     : 'adminUser',
  password : 'ThatsNotAPassword629451!',
  database : 'NationalParksMySql'
});
var request = require('request');
var https = require('https');

var ids = [];
var lats = [];
var lons = [];
var id=[];	

var weather = [];
var weather_code = [];
var min_temperature = [];
var max_temperature = [];
var time = [];
var humidity = [];
var sunrise = [];
var sunset = [];

function init(ids,lats,lons,callback){
	var query1 = "TRUNCATE TABLE Weather";
	connection.query(query1, function(err, rows, fields) {
	if (err) console.log(err);
	});
	var query = "SELECT Id,latitude,longitude FROM NationalPark";
	connection.query(query, function(err, rows, fields) {
		if (err) console.log(err);
		else {
			for(var i = 0;i<rows.length;i++){
				ids.push(rows[i].Id);
				lats.push(rows[i].latitude);
				lons.push(rows[i].longitude);			
			}
			callback();
		}
	});	
}


function weather_collect(weather,min_temperature,max_temperature,weather_code,time,humidity,sunrise,sunset,lat,lon,ids,id,callback){
	weather_url = "http://api.apixu.com/v1/forecast.json?key=1910d08aadc74902bd950044172202&days=5&q="+lat+","+lon;
	request({
	    url: weather_url,
	    json: true
	}, function (error, response, body) {
	    if (!error && response.statusCode === 200) {
	    	weather.length = 0;
			weather_code.length = 0;
			min_temperature.length = 0;
			max_temperature.length = 0;
			time.length = 0;
			humidity.length = 0;
			sunrise.length = 0;
			sunset.length = 0;
			id.length = 0;
	    	for(var i =0;i<5;i++){
		        var temp_weather = body["forecast"]["forecastday"][i]["day"]["condition"]["text"];
		        var temp_weather_code = body["forecast"]["forecastday"][i]["day"]["condition"]["icon"];
		        var temp_time = body["forecast"]["forecastday"][i]["date"];
		        var temp_humidity = body["forecast"]["forecastday"][i]["day"]["avghumidity"];
		        weather.push(temp_weather);
		        humidity.push(temp_humidity);
		        weather_code.push(temp_weather_code);
		        time.push(temp_time);
		        var temp_sunrise = body["forecast"]["forecastday"][i]["astro"]["sunrise"];
		        if(temp_sunrise.substring(5)=="PM"&&temp_sunrise.substring(0,2)!="12"){
		        	var temp_txt = (parseInt(temp_sunrise.substring(0,2))+12).toString();
		        	temp_sunrise[0] = temp_txt[0];
		        	temp_sunrise[1] = temp_txt[1];
		        }
		        temp_sunrise = temp_sunrise.substring(0,5);
	        	var temp_sunset = body["forecast"]["forecastday"][i]["astro"]["sunset"];
		        if(temp_sunset.substring(5)=="PM"&&temp_sunset.substring(0,2)!="12"){
		        	var temp_txt = (parseInt(temp_sunset.substring(0,2))+12).toString();
		        	temp_sunset[0] = temp_txt[0];
		        	temp_sunset[1] = temp_txt[1];
		        }
		        temp_sunset = temp_sunset.substring(0,5);
		        sunrise.push(temp_sunrise);
		        sunset.push(temp_sunset);
		        var temp_min_temperature=body["forecast"]["forecastday"][i]["day"]["mintemp_f"];
		        var temp_max_temperature=body["forecast"]["forecastday"][i]["day"]["maxtemp_f"];
		        min_temperature.push(temp_min_temperature);
		        max_temperature.push(temp_max_temperature);
		    }	    
    		id.push(ids);
			callback();
	    }
	});
};

init(ids,lats,lons,function(){
	for(var j = 0;j<ids.length;j++){
		weather_collect(weather,min_temperature,max_temperature,weather_code,time,humidity,sunrise,sunset,lats[j],lons[j],ids[j],id,function(){
			for(var i = 0;i<weather.length;i++){
				var query1 = {
					code:weather_code[i],
					description:weather[i],
					date:time[i],
					sunrise_time:sunrise[i],
					sunset_time:sunset[i],
					low_temperature:min_temperature[i],
					high_temperature:max_temperature[i],
					humidity:humidity[i],
					parkId:id[0]
				};
				var q = connection.query('INSERT INTO Weather SET ?',query1,function(err,rows,fields){
					 if(err) console.log(err);
				});
			}
		});
	}
	setTimeout(function(){
		connection.end();
	}, 4000); 
});

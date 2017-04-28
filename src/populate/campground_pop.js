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
var phones = [];
var names = [];
var lats = [];
var lons = [];
var id = [];		

function init(ids,callback){
	var query1 = "TRUNCATE TABLE Campground";
	connection.query(query1, function(err, rows, fields) {
	if (err) console.log(err);
	});
	var query = "SELECT Id FROM NationalPark";
	connection.query(query, function(err, rows, fields) {
		if (err) console.log(err);
		else {
			for(var i = 0;i<rows.length;i++){
				ids.push(rows[i].Id);		
			}
			callback();
		}
	});	
}


function camp_collect(phones,names,lats,lons,ids,id,callback){
	var url = "https://ridb.recreation.gov/api/v1/recareas/"+ids+"/facilities.json?apikey=CEF8D05EB8AC47D5BF44279EB9A48E59";
	request({
	    url: url,
	    json: true
	}, function (error, response, body) {
	    if (!error && response.statusCode === 200) {
	    	phones.length = 0;
	    	names.length = 0;
	    	lats.length = 0;
	    	lons.length = 0;
	    	id.length = 0;
	    	id.push(ids);
	    	for(var j = 0;j<body["RECDATA"].length;j++){
	    		if(body["RECDATA"][j]["GEOJSON"]!=undefined&&(body["RECDATA"][j]["FacilityName"].indexOf("Camp")!=-1||body["RECDATA"][j]["FacilityName"].indexOf("CAMP")!=-1)){
	    			phones.push(body["RECDATA"][j]["FacilityPhone"]);
		    		names.push(body["RECDATA"][j]["FacilityName"]);
		    		lats.push(body["RECDATA"][j]["GEOJSON"]["COORDINATES"][1]);
		    		lons.push(body["RECDATA"][j]["GEOJSON"]["COORDINATES"][0]);					    		
	    		}
    		}
		    callback();
	    }
	});
}

init(ids,function(){
	for(var i = 0;i<ids.length;i++){
		camp_collect(phones,names,lats,lons,ids[i],id,function(){
			for(var j = 0;j<phones.length;j++){
				var query1 = {
					name:names[j],
					latitude:lats[j],
					longitude:lons[j],
					phone:phones[j],
					parkCode:id[0]
				};
				var q = connection.query('INSERT INTO Campground SET ?',query1,function(err,rows,fields){
					 if(err) console.log(err);
				});
			}
		});
	}
	setTimeout(function(){
		connection.end();
	}, 10000); 
});
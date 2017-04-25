var mysql = require('mysql');
var connection = mysql.createConnection({
  host     : 'db-group8-mysql.cd4nksdzz6ad.us-east-1.rds.amazonaws.com',
  user     : 'adminUser',
  password : 'yourPassword986274',
  database : 'NationalParksMySql'
});
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;


var ids = [];
var id = [];
var codes = [];

var val = 0;

var park_alert_t = [];
var park_alert_d = [];
var park_caution_t = [];
var park_caution_d = [];


function init(ids,codes,callback){
	var query1 = "TRUNCATE TABLE Alert";
	connection.query(query1, function(err, rows, fields) {
	if (err) console.log(err);
	});
	var query = "SELECT Id,park_code FROM NationalPark";
	connection.query(query, function(err, rows, fields) {
		if (err) console.log(err);
		else {
			for(var i = 0;i<rows.length;i++){
				ids.push(rows[i].Id);
				codes.push(rows[i].park_code);			
			}
			callback();
		}
	});	
}


function alert_collect(park_alert_t,park_alert_d,park_caution_t,park_caution_d,park_code,ids,id,callback){
	var url = "https://developer.nps.gov/api/v0/alerts?parkCode="+park_code;
	var item = new Object();
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open('GET',url,false);
	xmlhttp.setRequestHeader("Authorization", "FD95430A-AA83-4095-AA31-C1C5A8DA02FF");
	xmlhttp.send(null);

	park_alert_t.length = 0;
	park_alert_d.length = 0;
	park_caution_t.length = 0;
	park_caution_d.length = 0;
	id.length = 0;

	console.log(url+":"+xmlhttp.status);
	if(xmlhttp.status===200){
		item = JSON.parse(xmlhttp.responseText);
		console.log(item);
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
		id.push(ids);
		callback();
	}
}

function start(counter,ids,codes){
	if(counter<ids.length){
		setTimeout(function(){
			counter++;
			alert_collect(park_alert_t,park_alert_d,park_caution_t,park_caution_d,codes[counter],ids[counter],id,function(){
				for(var i = 0;i<park_caution_t.length;i++){
					var query1 = {
						category:"Caution",
						title:park_caution_t[i],
						description:park_caution_d[i],
						park_code:id[0]
					};
					var q = connection.query('INSERT INTO Alert SET ?',query1,function(err,rows,fields){
						 if(err) console.log(err);
					});
				}
				for(var i = 0;i<park_alert_t.length;i++){
					var query1 = {
						category:"Alert",
						title:park_alert_t[i],
						description:park_alert_d[i],
						park_code:id[0]
					};
					var q = connection.query('INSERT INTO Alert SET ?',query1,function(err,rows,fields){
						 if(err) console.log(err);
					});
				}
			});
			start(counter,ids,codes);
		},100);
	}
}


init(ids,codes,function(){
	start(0,ids,codes);
	// setTimeout(function(){
	// 	connection.end();
	// }, 60000); 
});



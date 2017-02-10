var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');

var states;
var activities;
var park_name = [];
var latitude = [];
var longitude = [];
var website = [];
// Connect to the db
MongoClient.connect("mongodb://wbowen:w773980@ds147079.mlab.com:47079/state_info", function(err, db) {
  if(!err) {
    console.log("We are connected");
    var collection1 = db.collection('state');
    var collection2 = db.collection('activity');
    collection1.find().toArray(function(err, items) {
        if(!err)
	        states = items;    
        // console.log(items);            
    });
    collection2.find().toArray(function(err, items) {
        if(!err) 
	        activities = items;            
    });
  }
});

url = 'https://en.wikipedia.org/wiki/List_of_national_parks_of_the_United_States';
request(url, function(error, response, html){
	if(!error){
		var $ = cheerio.load(html);
        
        //var state = [];
	     $('.wikitable tr th>a').each(function(){
	     	park_name.push($(this).text());
	     });
		$('.latitude').each(function(){
			var temp = $(this).text();
			var pos = temp.indexOf('°');
			var temp1 = temp.substring(0,pos);
			temp1 = temp1 + '.'+temp.substring(pos+1,pos+1+2);
	     	if(temp[temp.length-1]=='S')
				temp1 = '-'+temp1;
	     	latitude.push(temp1);
	     });
		$('.longitude').each(function(){
			var temp = $(this).text();
			var pos = temp.indexOf('°');
			var temp1 = temp.substring(0,pos);
			temp1 = temp1+'.'+temp.substring(pos+1,pos+1+2);
	     	if(temp[temp.length-1]=='W')
				temp1 = '-'+temp1;
	     	longitude.push(temp1);
	     });
		$('.wikitable tr th>a').each(function(){
			var prefix = "https://en.wikipedia.org";
			prefix = prefix + $(this).attr('href');
	     	website.push(prefix);
	     });
    }
});

router.get('/',function(req,res,next){
	res.render('index',{states: states,activities:activities,park_name:park_name,latitude:latitude,longitude:longitude,website:website});
});

module.exports = router;
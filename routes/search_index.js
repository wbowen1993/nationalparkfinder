var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');
var opn = require('opn');

var states;
var activities;
var state = [];
var park_name = [];
var latitude = [];
var longitude = [];
var website = [];
var official_website = [];
var image_url = [];
// Connect to the db
MongoClient.connect("mongodb://wbowen:w773980@ds147079.mlab.com:47079/state_info", function(err, db) {
  if(!err) {
    console.log("We are connected to database:states_info!");
    var collection = db.collection('activity');
    collection.find().toArray(function(err, items) {
        if(!err) 
	        activities = items;            
    });
  }
});

MongoClient.connect("mongodb://wbowen:11111111@ds147599.mlab.com:47599/national_park", function(err, db) {
  if(!err) {
    console.log("We are connected database: national_park!");
    var collection = db.collection('states_info');
    var collection1 = db.collection('park_info_from_WIKI');
    collection.find().toArray(function(err, items) {
        if(!err)
            states = items;    
        // console.log(items);            
    });
    collection1.find().toArray(function(err, items) {
        if(!err)
        	for(var i = 0;i<items.length;i++){
	             park_name.push(items[i]["name"]);
	             website.push(items[i]["website"]);
	             latitude.push(items[i]["latitude"]);
	             longitude.push(items[i]["longitude"]);
	             image_url.push(items[i]["image"]); 
	             state.push(items[i]["state"]);   
        	}            
    });
  }
});

router.get('/search_index',function(req,res,next){
	res.render('search_index',{states: states,activities:activities,park_name:park_name,latitude:latitude,longitude:longitude,website:website,state:state,image_url:image_url});
});

module.exports = router;
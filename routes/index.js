var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');

var states;
var activities;
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
    collection.find().toArray(function(err, items) {
        if(!err)
            states = items;           
    });
  }
});

router.get('/',function(req,res,next){
	res.render('index',{states: states,activities:activities});
});

module.exports = router;
var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');

var states;
var activities;
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

router.get('/',function(req,res,next){
	res.render('index',{states: states,activities:activities});
});

module.exports = router;
var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var states = [];
var my_activities = [];
var activities = [];

var User = require('../model/user');
// Connect string to MySQL
var connection = mysql.createConnection({
  host     : 'db-group8-mysql.cd4nksdzz6ad.us-east-1.rds.amazonaws.com',
  user     : 'adminUser',
  password : 'ThatsNotAPassword629451!', // This is not the correct password! Please enter your own.
  database : 'NationalParksMySql'
});

// Connect to the db
MongoClient.connect("mongodb://wbowen:w773980@ds147079.mlab.com:47079/state_info", function(err, db) {
  if(!err) {
    // console.log("We are connected to database:states_info!");
    activities.length = 0;
    var collection = db.collection('activity');
    collection.find().toArray(function(err, items) {
        if(!err)
        for(var i = 0;i<items.length;i++) 
	        activities.push((items[i].activity_name).toUpperCase());            
    });
  }
});

function userActivitiesQuery(my_activities,callback){
    my_activities.length = 0;
    var query = "SELECT DISTINCT Type FROM Activities ORDER BY Type";
    connection.query(query, function(err, rows, fields) {
      if (err) console.log(err);
      else 
      {
          for(var i = 0;i<rows.length;i++){
              // console.log("Type: " + rows[i].Type);
              my_activities.push(rows[i].Type);
          }
          callback();
      }
    });
}

function statesQuery(state,callback){
  state.length = 0;
  var query = "SELECT DISTINCT state FROM NationalPark ORDER BY state";
  connection.query(query, function(err, rows, fields) {
      if (err) console.log(err);
      else{
          for(var i = 0;i<rows.length;i++)
          {
              // console.log(rows[i].state);
              states.push(rows[i].state);
          }
          callback();
      }
  });
}

router.get('/',function(req,res,next){
    var session = "false";
    var profile_img = "";
    if(req.session&&req.session.user){
      session = "true";
      User.findOne({email:req.session.user.email},function(err,user){
        if(!user);
        else{
          profile_img = user.profile_img;
        }
      });
    }
    userActivitiesQuery(my_activities,function(){
        // console.log(states.length);
        statesQuery(states,function(){
            res.render('index',{states: states,activities:activities, my_activities:my_activities,session:session,profile_img:profile_img});
        });
    });
});

module.exports = router;
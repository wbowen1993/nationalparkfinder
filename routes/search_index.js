var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');
var mysql = require('mysql');
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');
var opn = require('opn');
var url = require('url');

var all_state = [];
var all_park_name = [];
var all_latitude = [];
var all_longitude = [];
var all_website = [];
var all_image_url = [];
var all_park_code = [];
var all_activities = [];
var all_park_activities_code = [];

// Connect string to MySQL
var connection = mysql.createConnection({
  host     : 'db-group8-mysql.cd4nksdzz6ad.us-east-1.rds.amazonaws.com',
  user     : 'adminUser',
  password : 'yourPassword986274', // This is not the correct password! Please enter your own.
  database : 'NationalParksMySql'
});


MongoClient.connect("mongodb://wbowen:11111111@ds147599.mlab.com:47599/national_park", function(err, db) {
    if(!err) {
        console.log("We are connected database: national_park!");
        var collection1 = db.collection('all_parks_info');
        // var collection2 = db.collection('park_info_from_RIDB');
        var collection3 = db.collection('park_activity');
        var collection4 = db.collection('activity_list');
        collection1.find().toArray(function(err, items) {
            if(!err)
            	for(var i = 0;i<items.length;i++){
                    all_park_code.push(items[i]["id"]);
                    all_park_name.push(items[i]["name"]);
                    all_website.push(items[i]["website"]);
                    all_latitude.push(items[i]["latitude"]);
                    all_longitude.push(items[i]["longitude"]);
                    all_image_url.push(items[i]["img_url"]); 
                    all_state.push(items[i]["state"]);
                    all_park_activities_code.push([]);   
            	}            
        });
        collection3.find().toArray(function(err, items) {
            if(!err){
                for(var i = 0;i<all_park_code.length;i++){
                    for(var j = 0;j<items[0]["table"].length;j++){
                        if(all_park_code[i]==items[0]["table"][j]["id"]){
                            var temp_arr = [];
                            for(var k=0;k<items[0]["table"][j]["activities"].length;k++)
                                temp_arr.push(items[0]["table"][j]["activities"][k]["activity"]);
                            all_activities.push(temp_arr);
                            break;
                        }
                    }
                }
            }
        });
        collection4.find().toArray(function(err, items) {
            if(!err){
                for(var i = 0;i<items.length;i++){
                    // console.log(items[i]["activity_name"]);
                    for(var j = 0;j<all_state.length;j++){
                        // console.log(all_activities[j].length);
                        if(all_activities[j].includes(items[i]["activity_name"].toUpperCase()))
                            all_park_activities_code[j].push(items[i]["activity_id"]);
                    }
                }
            }
        });  
    }
});

function sqlQuery(inState, inActivity, inUsrActivity,
park_name, park_code, state, latitude, longitude, website, image_url, callback)
{
    query = "";
    if(inState!="")
    {
        query = "SELECT * FROM NationalPark Np WHERE Np.state=\"" + inState + "\";";
    }
    else if (inUsrActivity!="")
    {
        if (inUsrActivity!="Any")
        {
        query = "SELECT NP.name, NP.park_code, NP.state, NP.latitude, NP.longitude, NP.website, NP.img_url"
              + " FROM NationalPark NP, Activities "
              + " WHERE NP.Id = Activities.NPId AND Activities.Type = \"" + inUsrActivity + "\""
              + " GROUP BY NP.name "
              + " ORDER BY COUNT(*) DESC, NP.name;";
        }
        else
        {
        query   = "SELECT DISTINCT NP.name, NP.park_code, NP.state, NP.latitude, NP.longitude, NP.website, NP.img_url"
                + " FROM NationalPark NP"
                + " WHERE NP.name IN "
                + " (SELECT NationalPark.name"
                + " FROM NationalPark, Activities"
                + " WHERE NationalPark.Id = Activities.NPId) "
                + " ORDER BY NP.name";
        }
    }
    else
    {
        query = "SELECT * FROM NationalPark;";
    }
    
    connection.query(query, function(err, rows, fields) {
    if (err) console.log(err);
    else 
    {
        for(var i = 0;i<rows.length;i++)
        {
            console.log("NamePark: " + rows[i].name);
            park_name.push(rows[i].name);
            park_code.push(rows[i].park_code);
            state.push(rows[i].state);
            latitude.push(rows[i].latitude);
            longitude.push(rows[i].longitude);
            website.push(rows[i].website);
            image_url.push(rows[i].img_url);
        }
        callback();
    }
    });
}

router.get('/search_index',function(req,res,next)
{
    // Input
    var queryData = url.parse(req.url, true).query;
    var state_q = decodeURI(queryData["state"]);
    var activity_q = decodeURI(queryData["activity"]);
    var myactivity_q = decodeURI(queryData["user_activity"]);

    // Output from SQL Table
    var park_name = [];
    var park_code = [];
    var state = [];
    var latitude = [];
    var longitude = [];
    var website = [];
    var image_url = [];
    
    // Output from json
    var activities = [];
    var park_activities_code_array = [];
    
    sqlQuery(state_q, activity_q, myactivity_q,
            park_name, park_code, state, latitude, longitude, website, image_url, function(){
            if(state_q!="")
            {
                for(var i = 0;i<all_state.length;i++)
                {
                    if(all_state[i]==state_q)
                    {
                        activities.push(all_activities[i]);
                        park_activities_code_array.push(all_park_activities_code[i]);
                    }
                }
            }
            else
            {
                for(var i = 0;i<all_state.length;i++){
                    activities.push(all_activities[i]);
                    park_activities_code_array.push(all_park_activities_code[i]);
                }  
            }
            if(activity_q!=""){
                if(state_q!=""){
                    var original_len = state.length;
                    for(var i=0;i<original_len;i++){
                        if(activities[i].includes(activity_q.toUpperCase())){
                            park_code.push(all_park_code[i]);
                            state.push(state[i]);
                            park_name.push(park_name[i]);
                            website.push(website[i]);
                            latitude.push(latitude[i]);
                            longitude.push(longitude[i]);
                            image_url.push(image_url[i]);
                            activities.push(activities[i]);
                            park_activities_code_array.push(all_park_activities_code[i]);
                        }
                    }
                park_code.splice(0,original_len);
                state.splice(0,original_len);
                park_name.splice(0,original_len);
                website.splice(0,original_len);
                latitude.splice(0,original_len);
                longitude.splice(0,original_len);
                image_url.splice(0,original_len);
                activities.splice(0,original_len);
                park_activities_code_array.splice(0,original_len);
                }
                else{
                    park_code.splice(0,park_code.length);
                    state.splice(0,state.length);
                    park_name.splice(0,park_name.length);
                    website.splice(0,website.length);
                    latitude.splice(0,latitude.length);
                    longitude.splice(0,longitude.length);
                    image_url.splice(0,image_url.length);
                    activities.splice(0,activities.length); 
                    park_activities_code_array.splice(0,park_activities_code_array.length);
                    for(var i=0;i<all_state.length;i++){      
                        if(all_activities[i].includes(activity_q.toUpperCase())){
                            park_code.push(all_park_code[i]);
                            state.push(all_state[i]);
                            park_name.push(all_park_name[i]);
                            website.push(all_website[i]);
                            latitude.push(all_latitude[i]);
                            longitude.push(all_longitude[i]);
                            image_url.push(all_image_url[i]);
                            activities.push(all_activities[i]);
                            park_activities_code_array.push(all_park_activities_code[i]);
                        }
                    }
                }   
            }
            res.render('search_index',{activity_q: activity_q,state_q: state_q,activities:activities,park_name:park_name,activities:activities,park_activities_code_array:park_activities_code_array,latitude:latitude,longitude:longitude,website:website,state:state,image_url:image_url});
        });
});

module.exports = router;
var express = require('express');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');
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

MongoClient.connect("mongodb://wbowen:11111111@ds147599.mlab.com:47599/national_park", function(err, db) {
    if(!err) {
        console.log("We are connected database: national_park!");
        var collection1 = db.collection('park_info_from_WIKI');
        var collection2 = db.collection('park_info_from_RIDB');
        var collection3 = db.collection('park_activity');
        collection1.find().toArray(function(err, items) {
            if(!err)
            	for(var i = 0;i<items.length;i++){
    	             all_park_name.push(items[i]["name"]);
    	             all_website.push(items[i]["website"]);
    	             all_latitude.push(items[i]["latitude"]);
    	             all_longitude.push(items[i]["longitude"]);
    	             all_image_url.push(items[i]["image"]); 
    	             all_state.push(items[i]["state"]);   
            	}            
        });
        collection2.find().toArray(function(err, items) {
            if(!err)
                for(var i = 0;i<all_state.length;i++){
                    for(var j = 0;j<items[0]["table"].length;j++){
                        if(all_park_name[i]==items[0]["table"][j]["name"]){
                            all_park_code.push(items[0]["table"][j]["id"]);
                            break;
                        }
                        if(j==items[0]["table"].length-1)
                            console.log(all_park_name[i]);
                    }
                }
        });
        collection3.find().toArray(function(err, items) {
            if(!err){
                // console.log(all_park_name.length);
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
    }
});

router.get('/search_index',function(req,res,next){
    console.log(all_activities.length);
    var state = [];
    var park_name = [];
    var latitude = [];
    var longitude = [];
    var website = [];
    var image_url = [];
    var activities = [];
    var park_code = [];
    var queryData = url.parse(req.url, true).query;
    var state_q = decodeURI(queryData["state"]);
    var activity_q = decodeURI(queryData["activity"]);
    if(state_q!="")
        for(var i = 0;i<all_state.length;i++){
            if(all_state[i]==state_q){
                park_code.push(all_park_code[i]);
                state.push(all_state[i]);
                park_name.push(all_park_name[i]);
                website.push(all_website[i]);
                latitude.push(all_latitude[i]);
                longitude.push(all_longitude[i]);
                image_url.push(all_image_url[i]);
                activities.push(all_activities[i]);
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
        }
        else
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
                    console.log(all_park_code[i]+":"+all_park_name[i]);
                    for(var j = 0;j<all_activities[i].length;j++)
                        console.log(all_activities[i][j]);
                    console.log("----------------");
                }
            }

    }

	res.render('search_index',{activity_q: activity_q,state_q: state_q,activities:activities,park_name:park_name,latitude:latitude,longitude:longitude,website:website,state:state,image_url:image_url});
});

module.exports = router;
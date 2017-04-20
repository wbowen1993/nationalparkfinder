var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var url = require('url');


var park_name = [];
var latitude = [];
var longitude = [];
var website = [];
var image_url = [];
var park_code = [];

// Connect string to MySQL
var connection = mysql.createConnection({
  host     : 'db-group8-mysql.cd4nksdzz6ad.us-east-1.rds.amazonaws.com',
  user     : 'adminUser',
  password : 'yourPassword986274', // This is not the correct password! Please enter your own.
  database : 'NationalParksMySql'
});


function sqlQuery(inState, inActivity, inUsrActivity,park_code,
park_name, latitude, longitude, website, image_url, callback){
    var query = [];
    park_code.length = 0;
    park_name.length = 0;
    latitude.length = 0;
    longitude.length = 0;
    website.length = 0;
    image_url.length = 0;
    if(inState!=""&&inUsrActivity==""&&inActivity==""){
        query = "SELECT distinct(N.name) AS name,N.latitude AS latitude,N.longitude AS longitude,N.Id as code,";
        query += "N.img_url AS img_url,N.website AS website from NationalPark N where N.state='"+inState+"';";
    }
    else if(inState!=""&&inUsrActivity!=""&&inActivity==""){
        query = "SELECT distinct(N.name) AS name,N.latitude AS latitude,N.longitude AS longitude,N.Id as code,";
        query += "N.img_url AS img_url,N.website AS website from NationalPark N inner join Activities A on A.NPId=N.Id ";
        query += "where N.state='"+inState+"' and A.Type='"+inUsrActivity+"';";
    }
    else if(inState!=""&&inUsrActivity!=""&&inActivity!=""){
        query = "SELECT distinct(N.name) AS name,N.latitude AS latitude,N.longitude AS longitude,N.Id as code,N.img_url AS img_url,N.website AS website ";
        query += "from NationalPark N inner join General_activities G on G.Id=N.Id inner join Activities A on A.NPId=N.id ";
        query += "where N.state='"+inState+"' and A.Type='"+inUsrActivity+"' and G.activity='"+inActivity+"';";
    }
    else if(inState!=""&&inUsrActivity==""&&inActivity!=""){
        query = "SELECT distinct(N.name) AS name,N.latitude AS latitude,N.longitude AS longitude,N.Id as code,N.img_url AS img_url,N.website AS website ";
        query += "from NationalPark N inner join General_activities G on G.Id=N.id ";
        query += "where N.state='"+inState+"' and G.activity='"+inActivity+"';";
    }
    else if(inState==""&&inUsrActivity==""&&inActivity==""){
        query = "SELECT distinct(N.name) AS name,N.latitude AS latitude,N.longitude AS longitude,N.Id as code,N.img_url AS img_url,N.website AS website ";
        query += "from NationalPark N;";
    }
    else if(inState==""&&inUsrActivity!=""&&inActivity==""){
        query = "SELECT distinct(N.name) AS name,N.latitude AS latitude,N.longitude AS longitude,N.Id as code,N.img_url AS img_url,N.website AS website ";
        query += "from NationalPark N inner join Activities A on A.NPId=N.id ";
        query += "where A.Type='"+inUsrActivity+"';";
    }
    else if(inState==""&&inUsrActivity!=""&&inActivity!=""){
        query = "SELECT distinct(N.name) AS name,N.latitude AS latitude,N.longitude AS longitude,N.Id as code,N.img_url AS img_url,N.website AS website ";
        query += "from NationalPark N inner join General_activities G on G.Id=N.Id inner join Activities A on A.NPId=N.id ";
        query += "where A.Type='"+inUsrActivity+"' and G.activity='"+inActivity+"';";
    }
    else{
        query = "SELECT distinct(N.name) AS name,N.latitude AS latitude,N.longitude AS longitude,N.Id as code,N.img_url AS img_url,N.website AS website ";
        query += "from NationalPark N inner join General_activities G on G.Id=N.Id ";
        query += "where G.activity='"+inActivity+"';";
    } 
    console.log(query);
    connection.query(query, function(err, rows, fields) {
        if (err) console.log(err);
        else {
            for(var i = 0;i<rows.length;i++){
                console.log("NamePark: " + rows[i].name);
                park_code.push(rows[i].code);
                park_name.push(rows[i].name);
                latitude.push(rows[i].latitude);
                longitude.push(rows[i].longitude);
                website.push(rows[i].website);
                image_url.push(rows[i].img_url);
            }
        callback();
        }
    });
}

function activity_pop(park_name,park_activities_code_array,activities_code,callback){
    var query = "select a.id AS code from NationalPark N inner join General_activities G on G.id=N.Id ";
    query += "INNER JOIN activity_map a ON G.activity = a.name where N.name='"+park_name+"';";
    connection.query(query, function(err, rows, fields) {
        if (err) console.log(err);
        else {
            for(var i = 0;i<rows.length;i++){
                activities_code.push(rows[i].code);
            }
            park_activities_code_array.push(activities_code);
            callback();
        }
    });
}

router.get('/search_index',function(req,res,next)
{
    var session = "false";
    if(req.session&&req.session.user){
      session = "true";
    }
    // Input
    var queryData = url.parse(req.url, true).query;
    var state_q = decodeURI(queryData["state"]);
    var activity_q = decodeURI(queryData["activity"]);
    var myactivity_q = decodeURI(queryData["user_activity"]);

    // Output from SQL Table
    
    // Output from json
    var activities = [];
    var park_activities_code_array = [];
    
    sqlQuery(state_q, activity_q, myactivity_q,park_code,
            park_name, latitude, longitude, website, image_url, function(){
                park_activities_code_array.length = 0;
                console.log(park_name.length);
                if(park_name.length==0)
                    res.render('search_index',{activity_q: activity_q,state_q: state_q,park_code:park_code,park_name:park_name,
                        park_activities_code_array:park_activities_code_array,latitude:latitude,longitude:longitude,website:website,
                        image_url:image_url,session:session});
                else{
                    for(var i=0;i<park_name.length;i++){
                        var activities_code = [];
                        activity_pop(park_name[i],park_activities_code_array,activities_code,function(){
                            if(park_name.length==park_activities_code_array.length)
                                res.render('search_index',{activity_q: activity_q,state_q: state_q,park_code:park_code,park_name:park_name,
                                    park_activities_code_array:park_activities_code_array,latitude:latitude,longitude:longitude,website:website,
                                    image_url:image_url,session:session});
                        });
                    }  
                }
        });
});

module.exports = router;
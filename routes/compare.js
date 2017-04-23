var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var url = require('url');

var User = require('../model/user');

var connection = mysql.createConnection({
  host     : 'db-group8-mysql.cd4nksdzz6ad.us-east-1.rds.amazonaws.com',
  user     : 'adminUser',
  password : 'yourPassword986274', // This is not the correct password! Please enter your own.
  database : 'NationalParksMySql'
});

function query(code,method,park_set,callback){
	park_set.length = 0;
	var query = "SELECT distinct(N.name) as name,N.state as state,N.img_url as img_url,v1.num_of_restaurants as r_num,v2.num_of_activities as a_num,"
	query +="v6.a_ht as h_t,v7.a_lt as l_t,v3.a_rating as rating FROM NationalPark AS N LEFT OUTER JOIN v1 ON N.Id=v1.park_id ";
	query +="LEFT OUTER JOIN v2 ON N.Id=v2.park_id LEFT OUTER JOIN v6 ON N.Id=v6.parkId LEFT OUTER JOIN v7 ON N.Id=v7.parkId LEFT OUTER JOIN v3 ON N.Id=v3.park_id ";
	query +="where N.Id='"+code[0]+"'";
	console.log(method);
	if(method=='undefined'){
		for(var i = 1;i<code.length;i++){
			query += "OR N.Id='"+code[i]+"'";
		}
		query += ";";
	}
	else{
		if(method=='A'){
			for(var i = 1;i<code.length;i++){
				query += "OR N.Id='"+code[i]+"'";
			}
			query += " ORDER BY name asc;";
		}
		else if(method=='R_N'){
			for(var i = 0;i<code.length;i++){
				query += "OR N.Id='"+code[i]+"'";
			}
			query += " order by r_num desc;";
		}
		else if(method=='R_R'){
			for(var i=0;i<code.length;i++){
				query += "OR N.Id='"+code[i]+"'";
			}
			query += " ORDER BY rating DESC;";
		}
		else if(method=='T_L'){
			for(var i=0;i<code.length;i++){
				query += "OR N.Id='"+code[i]+"'";
			}
			query += " ORDER BY l_t asc;";
		}
		else if(method=='T_H'){
			for(var i=0;i<code.length;i++){
				query += "OR N.Id='"+code[i]+"'";
			}
			query += " ORDER BY h_t DESC;";
		}
		else if(method=='A_N'){
			for(var i=0;i<code.length;i++){
				query += "OR N.Id='"+code[i]+"'";
			}
			query += " ORDER BY a_num DESC;";
		}
	}
	connection.query(query, function(err, rows, fields) {
        if (err) console.log(err);
        else {
            for(var i = 0;i<rows.length;i++){
            	if(rows[i].rating==null)
            		rows[i].rating=0;
            	if(rows[i].r_num==null)
            		rows[i].r_num='-';
            	var park = {
            		name:rows[i].name,
            		img_url:rows[i].img_url,
            		r_num:rows[i].r_num,
            		rating:(rows[i].rating).toPrecision(2),
            		a_num:rows[i].a_num,
            		h_t:(rows[i].h_t).toPrecision(2),
            		l_t:(rows[i].l_t).toPrecision(2)
            	}
            	park_set.push(park);
            }
        callback();
        }
    });
}

router.get('/compare',function(req,res,next)
{
    // Input
    var session = "false";
    var profile_img = "";
    if(req.session&&req.session.user){
		session = "true";
		User.findOne({email:req.session.user.email},function(err,user){
			if(!user)
				res.redirect('/login');
			else{
				profile_img = user.profile_img;
				var queryData = url.parse(req.url, true).query;
				var parks = decodeURI(queryData["park"]);
				var method = decodeURI(queryData["method"]);
				var parks_code = [];
				var park_set =[];
				parks_code.push(parks.substring(0,4).toString());
				if(parks.length>4){
					for(var i = 0;i<(parks.length-4)/5;i++){
						parks_code.push(parks.substring(i*5+5,i*5+5+4).toString());
				    }
				}
				query(parks_code,method,park_set,function(){
				    res.render('compare',{parks:parks_code,park_set:park_set,session:session,method:method,profile_img:profile_img});
				});
			}
		});
    }
    else{
	    var queryData = url.parse(req.url, true).query;
	    var parks = decodeURI(queryData["park"]);
		var method = decodeURI(queryData["method"]);
		var parks_code = [];
		var park_set =[];
		parks_code.push(parks.substring(0,4).toString());
		if(parks.length>4){
	    	for(var i = 0;i<(parks.length-4)/5;i++){
	    		parks_code.push(parks.substring(i*5+5,i*5+5+4).toString());
		    }
	    }
		query(parks_code,method,park_set,function(){
		    res.render('compare',{parks:parks_code,park_set:park_set,session:session,method:method,profile_img:profile_img});
		});	
    }
});

module.exports = router;
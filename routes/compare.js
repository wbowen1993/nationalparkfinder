var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var url = require('url');

var connection = mysql.createConnection({
  host     : 'db-group8-mysql.cd4nksdzz6ad.us-east-1.rds.amazonaws.com',
  user     : 'adminUser',
  password : 'yourPassword986274', // This is not the correct password! Please enter your own.
  database : 'NationalParksMySql'
});

function query(names,code,method,img_url,r_num,callback){
	var query = '';
	names.length = 0;
	console.log(method);
	if(method=='undefined'){
		query = "SELECT N.name as name,N.img_url as img_url,count(*) as num from NationalPark N inner join Business B on N.Id=B.park_id where N.Id='"+code[0]+"'";
		for(var i = 1;i<code.length;i++){
			query += "OR N.Id='"+code[i]+"'";
		}
		query += " group by N.name;";
	}
	else{
		if(method=='A'){
			query = "SELECT N.name as name,N.img_url as img_url,count(*) as num from NationalPark N inner join Business B on N.Id=B.park_id where N.Id='"+code[0]+"'";
			for(var i = 1;i<code.length;i++){
				query += "OR N.Id='"+code[i]+"'";
			}
			query += " group by N.name ORDER BY name DESC;";
		}
		else if(method='R_N'){
			query = "SELECT N.name as name,N.img_url as img_url,count(*) as num from NationalPark N inner join Business B on N.Id=B.park_id where N.Id='"+code[0]+"'";
			for(var i = 0;i<code.length;i++){
				query += "OR N.Id='"+code[i]+"'";
			}
			query += " group by N.name order by num desc;";
		}
		// else if(method='R_R'){
		// 	query = "";
		// 	for(){

		// 	}
		// 	query += "";
		// }

	}
	connection.query(query, function(err, rows, fields) {
        if (err) console.log(err);
        else {
            for(var i = 0;i<rows.length;i++){
                names.push(rows[i].name);
                img_url.push(rows[i].img_url);
                r_num.push(rows[i].num);
            }
        callback();
        }
    });
}

router.get('/compare',function(req,res,next)
{
    // Input
    var queryData = url.parse(req.url, true).query;
    var parks = decodeURI(queryData["park"]);
	var method = decodeURI(queryData["method"]);
	var parks_code = [];
    var names = [];
    var img_url = [];
    var r_num = [];
	parks_code.push(parks.substring(0,4).toString());
	if(parks.length>4){
    	for(var i = 0;i<(parks.length-4)/5;i++){
    		parks_code.push(parks.substring(i*5+5,i*5+5+4).toString());
	    }
    }
	query(names,parks_code,method,img_url,r_num,function(){
	    res.render('compare',{parks:parks_code,names:names,img_url:img_url,r_num:r_num});
	});
});

module.exports = router;
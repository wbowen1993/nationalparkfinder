var http = require('http');
var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var RIDB_obj = {
   table: []
};

function write_json(obj,callback){
	for(var page = 0;page<4;page++){
	var url = "https://ridb.recreation.gov/api/v1/organizations/128/recareas.json?apikey=CEF8D05EB8AC47D5BF44279EB9A48E59&query=National+Park&offset="+50*page;

	request({
			    url: url,
			    json: true
			}, function (error, response, body) {
			    if (!error && response.statusCode === 200) {
			    	var len = body["RECDATA"].length;
			    	var count = 0;
			    	for(var i = 0;i<len;i++){
			    		if((body["RECDATA"][i]["RecAreaName"]).search("National Park")!=-1){
					    	var name = body["RECDATA"][i]["RecAreaName"];
					    	var id = body["RECDATA"][i]["RecAreaID"];
					    	var desc = body["RECDATA"][i]["RecAreaDescription"];
					    	RIDB_obj.table.push({
								id:id,
					    		name:name,
					    		description:desc});
					    	count++;
			    		}
			    	}
			    	console.log(count);
			    	callback();
			    }
			});
	}
}

write_json(obj,function(){
	var json = JSON.stringify(RIDB_obj);
	fs.writeFile('np_from_RIDB.json', json);
});
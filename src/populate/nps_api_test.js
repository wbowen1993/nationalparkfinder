var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var  xmlhttp = new XMLHttpRequest();
var fs = require('fs');

var url = "https://developer.nps.gov/api/v0/parks?limit=527";
xmlhttp.open('GET',url,true);
xmlhttp.setRequestHeader("Authorization", "FD95430A-AA83-4095-AA31-C1C5A8DA02FF","accept", "application/json");
xmlhttp.send(null);
xmlhttp.onreadystatechange = function() {
	console.log("OnReadystatechange + " + xmlhttp.readyState + " " + xmlhttp.status);
	if (xmlhttp.readyState == 4) {
		if ( xmlhttp.status == 200) {
			var item = JSON.parse(xmlhttp.responseText);
			// var total_num = item["total"];
			var limit = 527;
			var count = 0;
			for(var i = 0;i<limit;i++){
				if(item["data"][i]["designation"] == "National Park"||item["data"][i]["designation"] == "National Park & Preserve"
					||item["data"][i]["designation"] == "National Parks"||item["data"][i]["parkCode"] == "npsa"||item["data"][i]["parkCode"] == "redw"){
					count++;
					var fullName = item["data"][i]["fullName"];
					var weatherInfo = item["data"][i]["weatherInfo"];
					var directionsInfo = item["data"][i]["directionsInfo"];
					var parkCode = item["data"][i]["parkCode"];
					var configFile = fs.readFileSync('park_info.json');
					var config = JSON.parse(configFile);
				    config.table.push({
				    	id:parkCode,
				    	fullName:fullName,
				    	weatherInfo:weatherInfo,
				    	directionsInfo:directionsInfo
				    });
				    // console.log(config);
		        	var json = JSON.stringify(config);
		        	// console.log(json);
					fs.writeFileSync('park_info.json', json);
				}
			}
			console.log(count);
       }
	}
}


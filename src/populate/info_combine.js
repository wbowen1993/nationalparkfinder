var fs = require('fs');
var obj1,obj2,obj3,obj4;
function equiJoin(primary, foreign, primaryKey, foreignKey, select) {
    var m = primary.length, n = foreign.length, index = [], c = [];
    for (var i = 0; i < m; i++) {     // loop through m items
        var row = primary[i];
        index[row[primaryKey]] = row; // create an index for primary table
    }

    for (var j = 0; j < n; j++) {     // loop through n items
        var y = foreign[j];
        var x = index[y[foreignKey]]; // get corresponding row from primary
        c.push(select(x, y));         // select only the columns you need
    }

    return c;
}
fs.readFile('np_from_RIDB.json', 'utf8', function (err, data) {
	if (err) throw err;
	obj2 = JSON.parse(data);
	obj2 = obj2["table"];
	fs.writeFile('park_info_combine.json', '');
	fs.readFile('park_info.json', 'utf8', function (err, data) {
		if (err) throw err;
		obj1 = JSON.parse(data);
		obj1 = obj1["table"];
		var c = equiJoin(obj1, obj2,"fullName","name", function (obj1, obj2) {
	        return {
	            id: obj2.id,
	            name: obj2.name,
	            description: obj2.description,
	            park_code: obj1.id,
	            weather_info: obj1.weatherInfo,
	            directions_info: obj1.directionsInfo
	        };
		});
		fs.writeFileSync('park_info_combine.json', JSON.stringify(c));
		fs.readFile('park_info_combine.json', 'utf8', function (err, data) {
			if (err) throw err;
			obj4 = JSON.parse(data);
			fs.writeFile('park_info_final.json', '');
			fs.readFile('np_from_WIKI.json', 'utf8', function (err, data) {
				if (err) throw err;
				obj3 = JSON.parse(data);
				obj3 = obj3["table"];
				var c = equiJoin(obj3, obj4,"name","name", function (obj3, obj4) {
			        return {
			            id: obj4.id,
			            name: obj4.name,
			            description: obj4.description,
			            park_code: obj4.park_code,
			            weather_info: obj4.weather_info,
			            directions_info: obj4.directions_info,
			            state: obj3.state,
			            latitude: obj3.latitude,
			            longitude: obj3.longitude,
			            website: obj3.website,
			            img_url: obj3.image
			        };
				});
				fs.writeFileSync('park_info_final.json', JSON.stringify(c));
			});
		});
	});
});
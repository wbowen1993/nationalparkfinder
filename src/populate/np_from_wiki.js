var http = require('http');
var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');
var WIKI_obj = {
   table: []
};
var state = [];
var park_name = [];
var latitude = [];
var longitude = [];
var website = [];
var image_url = [];

url = 'https://en.wikipedia.org/wiki/List_of_national_parks_of_the_United_States';
request(url, function(error, response, html){
	if(!error){
		var $ = cheerio.load(html);
        
	     $('.wikitable tr th>a').each(function(){
	     	park_name.push($(this).text()+" National Park");
	     });
	     $('.wikitable tr th+td img').each(function(){
	     	image_url.push($(this).attr('src'));
	     });
		$('.latitude').each(function(){
			var temp = $(this).text();
			var pos = temp.indexOf('°');
			var temp1 = temp.substring(0,pos);
			temp1 = temp1 + '.'+temp.substring(pos+1,pos+1+2);
	     	if(temp[temp.length-1]=='S')
				temp1 = '-'+temp1;
	     	latitude.push(temp1);
	     });
		$('.longitude').each(function(){
			var temp = $(this).text();
			var pos = temp.indexOf('°');
			var temp1 = temp.substring(0,pos);
			temp1 = temp1+'.'+temp.substring(pos+1,pos+1+2);
	     	if(temp[temp.length-1]=='W')
				temp1 = '-'+temp1;
	     	longitude.push(temp1);
	     });
		$('.wikitable tr th>a').each(function(){
			var prefix = "https://en.wikipedia.org";
			prefix = prefix + $(this).attr('href');
	     	website.push(prefix);
	     });
		var i = 0;
		$('.wikitable tr td:nth-child(3) a:nth-child(1)').each(function(){
			var arr = $(this).attr('title');
			if(arr!=undefined){
				var pos = arr.indexOf('(');
				if(pos!=-1)
					arr=arr.substring(0,pos-1);
				state.push(arr);
			}
	     });
		for(var i = 0;i<state.length;i++){
			WIKI_obj.table.push({
				name:park_name[i],
				state:state[i],
				latitude:latitude[i],
				longitude:longitude[i],
				website:website[i],
				image:image_url[i]
			});
		}
		var json = JSON.stringify(WIKI_obj);
		fs.writeFile('np_from_WIKI.json', json);
    }
});





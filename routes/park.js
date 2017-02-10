var express = require('express');
var router = express.Router();
var request = require('request');
var https = require('https');
var Flickr = require("node-flickr");
var keys = {"api_key": "338ad28fc7b797a4836746d87db99105"}
flickr = new Flickr(keys);
var bgImg;

var key_words;

router.get('/park/:park_name',function(req,res,next){
	key_words = req.params.park_name;
	console.log(key_words);
	decodeURI(key_words);
	flickr.get("photos.search", {"text": key_words,"sort":"interestingness-desc","per_page":5,"page":1}, function(err, result){
	    if (err) return console.error(err);
	    // console.log(result.photos);
	    flickr.get("photos.getSizes", {"photo_id":result.photos.photo[1].id}, function(err, result1){
		    if (err) return console.error(err);
		    var temp_arr = result1.sizes.size;
		    bgImg = temp_arr[temp_arr.length-1].source;
			res.render('park',{key_words:key_words,bgImg:bgImg});
		});
	});
});

module.exports = router;
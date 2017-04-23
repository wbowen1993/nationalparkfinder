var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var User_rating = mongoose.Schema({
	park_name:String,
	email:String,
	scene_rating:Number,
	act_rating:Number,
	exp_rating:Number,
	date:String,
	days:Number,
	tag:[]
});

module.exports = mongoose.model('User_rating', User_rating);
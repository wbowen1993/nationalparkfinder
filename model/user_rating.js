var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var User_rating = mongoose.Schema({
	id:ObjectId,
	park_name:[],
	email:String,
});

module.exports = mongoose.model('User_rating', User_rating);
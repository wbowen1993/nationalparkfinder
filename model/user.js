var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var User = mongoose.Schema({
	id:ObjectId,
	first_name: String,
	last_name: String,
	email:{type:String, unique:true},
	password:String,
	profile_img:String
});

module.exports = mongoose.model('User', User);
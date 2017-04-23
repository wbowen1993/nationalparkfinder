var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var User_fav = mongoose.Schema({
	id:ObjectId,
	park_name:[],
	email:String,
});

module.exports = mongoose.model('User_fav', User_fav);
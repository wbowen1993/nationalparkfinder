var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');

var index = require('./routes/index');
var search_index = require('./routes/search_index');
var park = require('./routes/park');

var app = express();

var port = 80;

//View Engine
app.set('views', __dirname + '/views');
app.set('view engine','ejs');
app.engine('html',require('ejs').renderFile);

//Set static folder
app.use(express.static(path.join(__dirname, 'client')));
app.use(express.static('src'));
app.use(express.static('routes'));
app.use(express.static('views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.use('/',index);
app.use('/',park);
app.use('/',search_index);

app.listen(port,function(){
	console.log('server started '+port);
});
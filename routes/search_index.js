var express = require('express');
var router = express.Router();

router.get('/search_index',function(req,res,next){
	res.render('search_index.html');
});

module.exports = router;
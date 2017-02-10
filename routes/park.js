var express = require('express');
var router = express.Router();

router.get('/park',function(req,res,next){
	res.render('park.html');
});

module.exports = router;
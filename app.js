const http = require('http');
const express = require('express');
const request = require('request');


const app = express()

//enable cors
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});


app.get('/search', function (req, res) {
	var search = req.query.query;
	if (!search){
		console.log('empty')
		res.send([])
	}

	var url = "http://dev.markitondemand.com/MODApis/Api/v2/Lookup/json?input="+search;


	setTimeout(function(){
		request(url, function (error, response, body) {
			var companies = JSON.parse(body).map(d => (d));
			console.log(companies)
			res.send(companies)
		});
	}, 2000);

	// res.send(search)
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
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


app.get('/', function (req, res) {
	var symbol = req.query.symbol;

	var promises = [];
	
	var price;
  var url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + symbol +"&apikey=M2E9XXHLFH4GPHF2"
	promises.push(new Promise((resolve, reject) => {request(url, function (error, response, body) {
		price = JSON.parse(body)
		resolve()
	})}));

	var SMA;
  var url = "https://www.alphavantage.co/query?function=SMA&symbol=" + symbol +"&interval=15min&time_period=10&series_type=close&apikey=M2E9XXHLFH4GPHF2"
	promises.push(new Promise((resolve, reject) => {request(url, function (error, response, body) {
		SMA = JSON.parse(body)
		resolve()
	})}));

	Promise.all(promises)
	.then((results) => {
		var json = {"Price": price, "SMA": SMA}
		console.log(json)
		res.send(json)
	})
})


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
const http = require('http');
const express = require('express');
const request = require('request');


const app = express()

app.use('/', express.static(__dirname + '/public'));

//enable cors
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
})

app.get('/price/:symbol', function (req, res) {
	var symbol = req.params['symbol'];

	var price; 
  var url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + symbol + "&apikey=M2E9XXHLFH4GPHF2"
	request(url, function (error, response, body) {

		if (body.includes("Error")){
			res.status(404).send(error)
		} else {
			res.send(body)
		}
	})
})


app.get('/search', function (req, res) {
	var search = req.query.query;
	if (!search){
		res.send([])
	} else {
		var url = "http://dev.markitondemand.com/MODApis/Api/v2/Lookup/json?input="+search;

		request(url, function (error, response, body) {
			var companies = JSON.parse(body).map(d => (d));
			res.send(companies)
		});
	}

	// res.send(search)
})

app.get('/news/:symbol', function(req, res){

	var symbol = req.params['symbol'];
	var url = "https://seekingalpha.com/api/sa/combined/"+symbol+".xml";
	request(url, function (error, response, body) {
		res.send(body)
	});
});

app.get('/indicator/:indicator/:symbol', function (req, res) {
	var symbol = req.params['symbol'];
	var indicator = req.params['indicator'];

	var price;
  var url = "https://www.alphavantage.co/query?function="+ indicator + "&symbol=" + symbol + "&interval=daily&time_period=10&series_type=close&apikey=M2E9XXHLFH4GPHF2"
	request(url, function (error, response, body) {
		res.send(body)
	})
})

app.listen(8080, function () {
  console.log('Example app listening on port 8080!')
})
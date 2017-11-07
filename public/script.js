
var BACKEND_URL = "http://localhost:8080"

var app = angular
  .module('stockSearch', ['ngMaterial', 'ngMessages', 'ngAnimate', 'ngSanitize'])
  .controller('stockSearchController', stockSearchController)
  // .constant("$MD_THEME_CSS","");

function stockSearchController ($timeout, $q, $log, $http, $scope) {

  var self = this;  
  // list of states to be displayed
  self.timeouted;
  self.results = [];
  $scope.sortBy = 'Default'
  $scope.order = 'Ascending'
  $scope.sortings = ['Default', 'Symbol', 'Price', 'Change', 'Change Percent', 'Volume'];
  $scope.orderings = ['Ascending', 'Descending'];

  self.clearSearch = function(){
    $scope.view.slide = 'left'
    $scope.ctrl.searchText = ""
    $scope.ctrl.selectedItem = ""
    $scope.autocompleteForm.$setPristine();
    $scope.autocompleteForm.$setValidity("autocompleteForm", true);
    $scope.autocompleteForm.$setUntouched("autocompleteForm", true);

  }
  function getStockPrice(stock){
    $http
    .get(BACKEND_URL + "/price/" + stock.symbol)
    .then(function(response){
      var metadata = response.data["Meta Data"]
      var timeseries = response.data["Time Series (Daily)"]
      var dates = Object.keys(timeseries).slice(0, 2)

      var today = timeseries[dates[0]]
      var yesterday = timeseries[dates[1]]

      // fields where trading hours don't matter
      stock['change'] = Number(today["4. close"] - yesterday["4. close"]).toFixed(2)
      stock['changePercent'] = (stock['change'] / yesterday["4. close"] * 100).toFixed(2)
      stock['volume'] = today["5. volume"]
      stock['stockPrice'] = Number(today["4. close"]).toFixed(2)
    })
  }
  $scope.refreshFavorites = function() {
    $log.info("refresh favorites")
    var favStorage = localStorage.getItem("favorites");
    var favArray = JSON.parse(favStorage)

    for (var i in favArray) {
      var oldStock = favArray[i]
      getStockPrice(oldStock)
    }
    $log.info(favArray);
    localStorage.setItem("favorites", JSON.stringify(favArray))
    $scope.favorites = favArray
  }
  self.showFavorites = function () {
    $scope.view.slide = 'left'
    var favStorage = localStorage.getItem("favorites");
    var favArray = JSON.parse(favStorage)
    $scope.favorites = favArray;
    if ($scope.sortBy == "Default"){
      $scope.favorites = favArray
    } else if ($scope.sortBy == "Symbol"){
      favArray.sort(function(a, b) {
        return a[1] - b[1];
      });
      $scope.favorites = favArray
    }
    // $log.info($scope.favorites)
  }
  self.sort = function(sortBy, order) {
    var favStorage = localStorage.getItem("favorites");
    var favArray = JSON.parse(favStorage)
    $log.info(favArray)
    if (sortBy == "Default"){
      $scope.favorites = favArray
    } else if (sortBy == "Symbol"){
      favArray.sort(function(a, b) {
        if (order == "Ascending"){
          return a["symbol"].localeCompare(b["symbol"]);
        } else {
          return b["symbol"].localeCompare(a["symbol"]);
        }
      });
      $scope.favorites = favArray
    } else if (sortBy == "Price") {
      favArray.sort(function(a, b) {
        if (order == "Ascending"){
          return a["stockPrice"] - b["stockPrice"];
        } else {
          return b["stockPrice"] - a["stockPrice"];
        }
      });
      $scope.favorites = favArray
    } else if (sortBy == "Change") {
      favArray.sort(function(a, b) {
        if (order == "Ascending"){
          return a["change"] - b["change"];
        } else {
          return b["change"] - a["change"];
        }
      });
      $scope.favorites = favArray
    } else if (sortBy == "Change Percent") {
      favArray.sort(function(a, b) {
        if (order == "Ascending"){
          return a["changePercent"] - b["changePercent"];
        } else {
          return b["changePercent"] - a["changePercent"];
        }
      });
      $scope.favorites = favArray
    } else if (sortBy == "Volume") {
      favArray.sort(function(a, b) {
        if (order == "Ascending"){
          return a["volume"] - b["volume"];
        } else {
          return b["volume"] - a["volume"];
        }
      });
      $scope.favorites = favArray
    }
  }
  function makePriceChart(prices, volumes, dates) {
    Highcharts.chart('Price-Chart', {
      chart: {
        type: 'area'
      },
      title: {
        text: "Stock Price and Volume"
      },

      subtitle: {
        text: '<a target="_blank" id="source-link" href="https://www.alphavantage.co/">Source: Alpha Vantage</a>',
        style: {
          color: '#4286f4'
        },
        useHTML: true

      },
      xAxis: {
        categories: dates,
        tickInterval: 5,
        showLastLabel: true,
        reversed: true,
        startOnTick: true,
        showFirstLabel: true
      },
      yAxis: [{
        // minPadding: 10000,
        // min: <?php echo $minPrice ?>,
        // max: <?php echo $maxPrice?>,
        title: {
          text: 'Stock Price'
        }
      },
      {
        tite: {
          text: 'Volume'
        },
        opposite: true,
        maxPadding: 4
      }],

      series: [{
        marker: {
          enabled: false,
        },
        name: $scope.symbol,
        data: prices,
        color: '#5000ff'

      },
      {
        yAxis: 1,
        type: "column",
        name: $scope.symbol+ " Volume",
        data: volumes,
        color: '#ff0000'
      }],

    });
  }


  self.updateFavorites = function(symbol) {
    symbol = symbol.toUpperCase()
    var favStorage = localStorage.getItem("favorites")    
    if (favStorage == null){
      $http.get(BACKEND_URL + "/price/" + symbol).then(function(response){
        var metadata = response.data["Meta Data"]
        var timeseries = response.data["Time Series (Daily)"]
        var dates = Object.keys(timeseries).slice(0, 2)

        var today = timeseries[dates[0]]
        var yesterday = timeseries[dates[1]]

        // fields where trading hours don't matter
        var stock = {}
        stock['symbol'] = metadata["2. Symbol"]
        stock['change'] = Number(today["4. close"] - yesterday["4. close"]).toFixed(2)
        stock['changePercent'] = (stock['change'] / yesterday["4. close"] * 100).toFixed(2)
        stock['volume'] = today["5. volume"]
        stock['stockPrice'] = Number(today["4. close"]).toFixed(2)

        localStorage.setItem("favorites", JSON.stringify([stock]))
      })
      $scope.star = "<span class='glyphicon glyphicon-star'></span>"

    } else {
      var favArray = JSON.parse(favStorage)

      if (favStorage.includes(symbol)){ // delete symbol
        $scope.star = "<span class='glyphicon glyphicon-star-empty'></span>"
        var index = -1;
        for (var i in favArray){
          if (Object.values(favArray[i]).includes(symbol)){
            index = i
            $log.info("index: " + index)
            $scope.favorites.splice(index, 1)
            break;
          }
        }
        if (index > -1) { 
            favArray.splice(index, 1);
        }
        localStorage.setItem("favorites", JSON.stringify(favArray))

      } else { // add symbol

        $http.get(BACKEND_URL + "/price/" + symbol).then(function(response){
          var metadata = response.data["Meta Data"]
          var timeseries = response.data["Time Series (Daily)"]
          var dates = Object.keys(timeseries).slice(0, 2)

          var today = timeseries[dates[0]]
          var yesterday = timeseries[dates[1]]

          // fields where trading hours don't matter
          var stock = {}
          stock['symbol'] = metadata["2. Symbol"]
          stock['change'] = Number(today["4. close"] - yesterday["4. close"]).toFixed(2)
          stock['changePercent'] = (stock['change'] / yesterday["4. close"] * 100).toFixed(2)
          stock['volume'] = today["5. volume"]
          stock['stockPrice'] = Number(today["4. close"]).toFixed(2)
          favArray.push(stock)
          localStorage.setItem("favorites", JSON.stringify(favArray))
        })


        $scope.star = "<span class='glyphicon glyphicon-star'></span>"
      }
    }
  }

  function setNews(symbol){
    $scope.news = []
    $http({
      url: BACKEND_URL + "/news/" + symbol,
      method: "GET",
    })
    .then(function(response) {

      var parser = new DOMParser();
      var xmlDoc = parser.parseFromString(response.data,"text/xml");

      for (var i = 0; i < 5; i++){
        var title = xmlDoc.getElementsByTagName("item")[i].getElementsByTagName("title")[0].childNodes[0].nodeValue
        var author = xmlDoc.getElementsByTagName("item")[i].getElementsByTagName("sa:author_name")[0].childNodes[0].nodeValue
        var link = xmlDoc.getElementsByTagName("item")[i].getElementsByTagName("link")[0].childNodes[0].nodeValue
        var pubDate = xmlDoc.getElementsByTagName("item")[i].getElementsByTagName("pubDate")[0].childNodes[0].nodeValue
        $scope.news.push({
          "title": title,
          "author": author,
          "link": link,
          "pubDate": pubDate
        })
      }

      return response.data;
    });

  }

  self.getQuote = function(symbol) {
    $http({
      url: BACKEND_URL + "/price/" + symbol,
      method: "GET",
    })
    .then(function(response) {
      self.showDetail(response)

      setNews(symbol);
          
      return response.data;
    }, function(error){
      alert("Not Found")
    });
  }

  function getStockSearch(query) {
    return $http({
      url: BACKEND_URL + "/search",
      method: "GET",
      params: {query}
    })
    .then(function(response) {
      // return response.data

      // var results = response.data.map(d => (d));
      return response.data;
    });
  }
  self.querySearch = function (query) {
    clearTimeout(self.timeouted)

    return new Promise(function(resolve, reject) {
      self.timeouted = setTimeout(function () {
        resolve(getStockSearch(query))
      }, 1000)
    }).then(function(done){
      $log.info(done)
      return done
    });


  }

  function makeIndicatorChart(indicator, symbol) {
    $http({
      url: BACKEND_URL + "/indicator/" + indicator + "/" + symbol,
      method:"GET"
    })
    .then(function(response) {
      $log.info(response)
      var data = response.data["Technical Analysis: " + indicator]
      var dates = Object.keys(data).slice(0,112)
      var keys = Object.keys(data[dates[0]])

      var series = []
      for (var i in keys) {
        var key = keys[i]
        var name = symbol + " " + key
        var values = Object.values(Object.values(data).slice(0,112)).map(function(value){
          return parseFloat(value[key])
        })
        series.push({
          "name": name,
          "data": values
        })
      }

      var title = {
         text: response.data["Meta Data"]["2: Indicator"]
      };
      var subtitle = {
        text: '<a target="_blank" id="source-link" href="https://www.alphavantage.co/">Source: Alpha Vantage</a>',
        style: {
          color: '#4286f4'
        }            
      };
      var xAxis = {
         categories: dates,
         tickInterval: 5,
         reversed:true
        };
      var yAxis = {
         title: {
          text: indicator
         }
      };   
      var json = {};
      json.title = title;
      json.subtitle = subtitle;
      json.xAxis = xAxis;
      json.yAxis = yAxis;
      json.series = series;
      Highcharts.chart(indicator + '-Chart', json);

      return response.data

    });
  }
  self.showDetail = function(response) {
    $scope.view.slide='right'

    var metadata = response.data["Meta Data"]
    var timeseries = response.data["Time Series (Daily)"]
    var dates = Object.keys(timeseries).slice(0, 112)
    var prices = dates.map(function(date){
      return timeseries[date]["4. close"]
    })
    var volumes = dates.map(function(date){
      return timeseries[date]["5. volume"]
    })
    var today = timeseries[dates[0]]
    var yesterday = timeseries[dates[1]]

    // fields where trading hours don't matter
    $scope.symbol = metadata["2. Symbol"].toUpperCase()
    $scope.change = Number(today["4. close"] - yesterday["4. close"]).toFixed(2)
    $scope.changePercent = ($scope.change / yesterday["4. close"] * 100).toFixed(2)
    $scope.open = Number(today["1. open"]).toFixed(2)
    $scope.timestamp = metadata["3. Last Refreshed"]
    $scope.range = Number(today["3. low"]).toFixed(2) + " - " + Number(today["2. high"]).toFixed(2)
    $scope.volume = today["5. volume"]
    $scope.lastPrice = Number(today["4. close"]).toFixed(2)
    Date.prototype.stdTimezoneOffset = function() {
        var jan = new Date(this.getFullYear(), 0, 1);
        var jul = new Date(this.getFullYear(), 6, 1);
        return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    }

    Date.prototype.dst = function() {
        return this.getTimezoneOffset() < this.stdTimezoneOffset();
    }

    var isDST = new Date();
    if (isDST.dst()) { $scope.timestamp += " EDT"} else { $scope.timestamp += " EST"}

    prices = prices.map(function(x){
      return parseFloat(x)
    })
    volumes = volumes.map(function(x){
      return parseFloat(x)
    })
    // fields where trading hours matter
    $scope.close = Number(today["4. close"]).toFixed(2)  
    $timeout(function() {
      // inject favorite star
      var isFavorite = false;
      for (var fav in $scope.favorites){
        if($scope.favorites[fav].symbol == $scope.symbol){
          isFavorite = true;
        }
      }
      if (isFavorite) {
        $scope.star = "<span class='glyphicon glyphicon-star'></span>"
      } else {
        $scope.star = "<span class='glyphicon glyphicon-star-empty'></span>"
      }

      // inject chart
      makePriceChart(prices, volumes, dates)


      // makeSMA($scope.symbol)
      // makeEMA($scope.symbol)
      // makeRSI($scope.symbol)
      // makeADX($scope.symbol)
      // makeCCI($scope.symbol)
      // makeSTOCH($scope.symbol)
      // makeBBANDS($scope.symbol)
      // makeMACD($scope.symbol)

      var indicators = ["SMA", "EMA", "RSI", "ADX", "CCI", "STOCH", "BBANDS", "MACD"]

      for (i in indicators){
        makeIndicatorChart(indicators[i], $scope.symbol)
      }

      Highcharts.stockChart('historicalChart', {

        chart: {
            height: 400,
            width:null
        },

        title: {
            text: 'Highstock Responsive Chart'
        },

        subtitle: {
            text: 'Click small/large buttons or change window size to test responsiveness'
        },

        rangeSelector: {
            selected: 1
        },

        series: [{
            name: $scope.symbol,
            data: prices,
            type: 'area',
            threshold: null,
            tooltip: {
                valueDecimals: 2
            }
        }],

        responsive: {
          rules: [{
              condition: {
                  maxWidth: 500
              },
              chartOptions: {
                  chart: {
                      height: 300
                  },
                  subtitle: {
                      text: null
                  },
                  navigator: {
                      enabled: false
                  }
              }
          }]
        }
      });
    })  
  }

  self.shareFacebook = function() {
    var chartType = $('.nav-tabs .active').text()
    var chartID = "#"+chartType + "-Chart"
    var chart=$(chartID).highcharts();

    var data = {
      options: chart.options,
      filename: chartID,
      type: 'image/png',
      async: true
    };
    var exportUrl = 'http://export.highcharts.com/';

    $http({
      url: exportUrl,
      method:"POST",
      data: data
    }).then(function(response){
      var url = exportUrl + "/"+response.data
      $log.info(url)

      FB.ui({
        method: 'feed',
        link: url,
      }, function(response){

      });

    })
  }
}
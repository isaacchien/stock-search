
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
    var favStorage = localStorage.getItem("favorites");
    var favArray = JSON.parse(favStorage)

    for (var i in favArray) {
      var oldStock = favArray[i]
      getStockPrice(oldStock)
    }
    localStorage.setItem("favorites", JSON.stringify(favArray))
    $scope.favorites = favArray
  }
  self.showFavorites = function () {
    $('input[type=checkbox][data-toggle^=toggle]').bootstrapToggle()
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
  }
  self.sort = function(sortBy, order) {
    var favStorage = localStorage.getItem("favorites");
    var favArray = JSON.parse(favStorage)
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
    dates = dates.map(function(x){
      var date = new Date(x)
      return ( (date.getMonth() + 1) + "/" + (date.getDate() + 1))
    })

    Highcharts.chart('Price-Chart', {
      chart: {
        type: 'area',
        zoomType: 'x'
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

      if (xmlDoc.getElementsByTagName("channel").length > 0){
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
      }

      if ($scope.news.length === 0) {
        $scope.error["News"] = true
      }

      $scope.loadingNews = false;
      return response.data;
    });

  }

  self.getQuote = function(symbol) {

    $scope.loadingCharts = true;
    $scope.loadingDetail = true;
    $scope.loadingHistorical = true;
    $scope.loadingNews = true;

    $scope.error = {
      'Price': false,
      'SMA': false,
      'EMA': false,
      'STOCH': false,
      'RSI': false,
      'ADX': false,
      'CCI': false,
      'BBANDS': false,
      'MACD': false,
      'News': false
    }

    $scope.symbol = symbol.toUpperCase()
    $http({
      url: BACKEND_URL + "/price/" + symbol,
      method: "GET",
    })
    .then(function(response) {
      $scope.view.slide='right'
      self.showDetail(response, symbol)

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
      return done
    });


  }

  function makeIndicatorChart(indicator, symbol) {
    $http({
      url: BACKEND_URL + "/indicator/" + indicator + "/" + symbol,
      method:"GET"
    })
    .then(function(response) {
      if (Object.keys(response.data).length === 0) {
        $scope.error[indicator] = true;
      } else {
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
        var chart = {
          zoomType: 'x'
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
        dates = dates.map(function(x){
          var date = new Date(x)
          return ( (date.getMonth() + 1) + "/" + (date.getDate() + 1))
        })
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
        json.chart = chart;
        json.title = title;
        json.subtitle = subtitle;
        json.xAxis = xAxis;
        json.yAxis = yAxis;
        json.series = series;
        Highcharts.chart(indicator + '-Chart', json);

        return response.data

      }

    });
  }
  self.showDetail = function(response) {
    if (Object.keys(response.data).length === 0) {
      $scope.error["Price"] = true;
      $scope.loadingCharts = false;
      $scope.loadingDetail = false;
      $scope.loadingHistorical = false;

    } else {
      var metadata = response.data["Meta Data"]
      var timeseries = response.data["Time Series (Daily)"]
      var historicalDates = Object.keys(timeseries).slice(0, 1000)
      var dates = historicalDates.slice(0, 112)
      var prices = dates.map(function(date){
        return timeseries[date]["4. close"]
      })
      var historicalPrices = historicalDates.map(function(date){
        return parseFloat(timeseries[date]["4. close"])
      })

      var volumes = dates.map(function(date){
        return timeseries[date]["5. volume"]
      })
      var today = timeseries[dates[0]]
      var yesterday = timeseries[dates[1]]






      // fields where trading hours don't matter
      $scope.change = Number(today["4. close"] - yesterday["4. close"]).toFixed(2)
      $scope.changePercent = ($scope.change / yesterday["4. close"] * 100).toFixed(2)
      $scope.open = Number(today["1. open"]).toFixed(2)
      $scope.timestamp = metadata["3. Last Refreshed"]


      var splittime = $scope.timestamp.split(/[ ,]+/);
      if(splittime.length == 1){
        $scope.timestamp += " 16:00:00 "
      }



      $scope.range = Number(today["3. low"]).toFixed(2) + " - " + Number(today["2. high"]).toFixed(2)
      $scope.volume = today["5. volume"]
      $scope.lastPrice = Number(today["4. close"]).toFixed(2)

      $scope.loadingDetail = false;
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
    }
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
      if (!$scope.error['Price']){
        makePriceChart(prices, volumes, dates)
      }

      var indicators = ["SMA", "EMA", "RSI", "ADX", "CCI", "STOCH", "BBANDS", "MACD"]

      for (i in indicators){
        makeIndicatorChart(indicators[i], $scope.symbol)
      }
      $scope.loadingCharts = false;

      if (Object.keys(response.data).length !== 0) {
      historicalDates = historicalDates.map(function(data){
        return new Date(data).getTime()
      })

      var result = [], i = -1;
      while ( historicalDates[++i] ) { 
        result.push( [ parseFloat(historicalDates[i]), parseFloat(historicalPrices[i]) ] );
      }
      result = result.reverse()

      var buttons = [
          {
              type: 'week',
              count: 1,
              text: '1w',
              dataGrouping: {
                  forced: true,
                  units: [['day', [1]]]
              }
          },  
          {
              type: 'month',
              count: 1,
              text: '1m',
              dataGrouping: {
                  forced: true,
                  units: [['week', [1]]]
              }
          }, 
          {
              type: 'month',
              count: 3,
              text: '3m',
              dataGrouping: {
                  forced: true,
                  units: [['week', [1]]]
              }
          }, 
          {
              type: 'month',
              count: 6,
              text: '6m',
              dataGrouping: {
                  forced: true,
                  units: [['week', [1]]]
              }
          },
          {
              type: 'year',
              count: 1,
              text: 'YTD',
              dataGrouping: {
                  forced: true,
                  units: [['month', [1]]]
              }
          },
          {
              type: 'year',
              count: 1,
              text: '1y',
              dataGrouping: {
                  forced: true,
                  units: [['week', [1]]]
              }
          },
          {
              type: 'all',
              text: 'All',
              dataGrouping: {
                  forced: true,
                  units: [['month', [1]]]
              }
          }];
      if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        buttons = [
          {
              type: 'month',
              count: 1,
              text: '1m',
              dataGrouping: {
                  forced: true,
                  units: [['week', [1]]]
              }
          }, 
          {
              type: 'month',
              count: 3,
              text: '3m',
              dataGrouping: {
                  forced: true,
                  units: [['week', [1]]]
              }
          }, 
          {
              type: 'month',
              count: 6,
              text: '6m',
              dataGrouping: {
                  forced: true,
                  units: [['week', [1]]]
              }
          },
          {
              type: 'year',
              count: 1,
              text: '1y',
              dataGrouping: {
                  forced: true,
                  units: [['week', [1]]]
              }
          },
          {
              type: 'all',
              text: 'All',
              dataGrouping: {
                  forced: true,
                  units: [['month', [1]]]
              }
          }];
      }


      Highcharts.stockChart('historicalChart', 
      {
        chart: {
            height: 400,
            width:null
        },
        rangeSelector: {
          allButtonsEnabled: true,
          buttons: buttons,
          selected: 0
        },
        title: {
          text: $scope.symbol +' Stock Value'
        },
        subtitle: {
          text:'<a target="_blank" href="https://www.alphavantage.co/">Source: Alpha Vantage</a>',
          style:{
            color:'blue'
          },
          useHTML:true
        },
        series: [{
          name: $scope.symbol,
          data: result,
          type:"area",
          tooltip: {
              valueDecimals: 2
          }
        }]
      });

      $scope.loadingHistorical = false;
      }
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

    $http({
      url: BACKEND_URL + "/export",
      method:"GET",
      params: {data: data}
    }).then(function(response){
      var url = 'https://export.highcharts.com/' +response.data
      FB.ui({
        method: 'feed',
        link: url,
      }, function(response){
        if (response && !response.error_message) {
          alert('Posted Successfully');
        } else {
          alert('Not Posted');
        }
      });

    })
  }
}
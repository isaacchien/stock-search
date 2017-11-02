
var BACKEND_URL = "http://localhost:3000"

var app = angular
  .module('stockSearch', ['ngMaterial', 'ngMessages', 'ngAnimate', 'ngSanitize'])
  .controller('stockSearchController', stockSearchController)
  // .constant("$MD_THEME_CSS","");

function stockSearchController ($timeout, $q, $log, $http, $scope) {

  var self = this;  
  // list of states to be displayed
  
  self.results = [];
  self.clearSearch = function(){
    $scope.view.slide = 'left'
    $scope.ctrl.searchText = ""
    $scope.ctrl.selectedItem = ""
    $scope.autocompleteForm.$setPristine();
    $scope.autocompleteForm.$setValidity("autocompleteForm", true);
    $scope.autocompleteForm.$setUntouched("autocompleteForm", true);

  }
  self.showFavorites = function () {
    var favStorage = localStorage.getItem("favorites")
    $scope.favorites = []

    if (favStorage){
      var favArray = JSON.parse(favStorage)
      favArray.map(function(favorite) {
        return $http({
          url: BACKEND_URL + "/price/" + favorite,
          method: "GET",
        }).then(function(response) {

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
          
          $scope.favorites.push(stock)
          return stock
        })
      })
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
      var favArray = [symbol]
    } else {
      var favArray = JSON.parse(favStorage)
      if (favArray.includes(symbol)){ // delete symbol
        $scope.star = "<span class='glyphicon glyphicon-star-empty'></span>"

        var index = favArray.indexOf(symbol);
        if (index > -1) { 
            favArray.splice(index, 1);
        }
      } else { // add symbol
        favArray.push(symbol)
        $scope.star = "<span class='glyphicon glyphicon-star'></span>"
      }
    }

    localStorage.setItem("favorites", JSON.stringify(favArray))
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
    });
  }


  self.querySearch = function (query) {

    self.results = $http({
      url: BACKEND_URL + "/search",
      method: "GET",
      params: {query}
    })
    .then(function(response) {
      // return response.data

      var results = response.data.map(d => (d));

      return response.data;
    });
  }
  

  function makeSMA(symbol) {
    $http({
      url: BACKEND_URL + "/indicator/SMA/" + symbol,
      method:"GET"
    })
    .then(function(response) {
      $log.info(response)
      var dates = Object.keys(response.data["Technical Analysis: SMA"]).slice(0,112)
      var values = Object.values(Object.values(response.data["Technical Analysis: SMA"]).slice(0,112)).map(function(kv){
        return parseFloat(kv["SMA"])
      })

      var title = {
         text: "Simple Moving Average: SMA"
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
          text: "SMA"
         }
      };   
      var series =  [{
        name: symbol,
        data: values
         }
      ];
      var json = {};
      json.title = title;
      json.subtitle = subtitle;
      json.xAxis = xAxis;
      json.yAxis = yAxis;
      json.series = series;
      Highcharts.chart('SMA-Chart', json);

      return response.data

    });
  }

  function makeEMA(symbol) {
    $http({
      url: BACKEND_URL + "/indicator/EMA/" + symbol,
      method:"GET"
    })
    .then(function(response) {
      $log.info(response)

      var dates = Object.keys(response.data["Technical Analysis: EMA"]).slice(0,112)
      var values = Object.values(Object.values(response.data["Technical Analysis: EMA"]).slice(0,112)).map(function(value){
        return parseFloat(value["EMA"])
      })

      var title = {
         text: "Exponential Moving Average: EMA"
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
          text: "EMA"
         }
      };   
      var series =  [{
        name: symbol,
        data: values
         }
      ];
      var json = {};
      json.title = title;
      json.subtitle = subtitle;
      json.xAxis = xAxis;
      json.yAxis = yAxis;
      json.series = series;
      Highcharts.chart('EMA-Chart', json);

      return response.data

    });
  }
  function makeRSI(symbol) {
    $http({
      url: BACKEND_URL + "/indicator/RSI/" + symbol,
      method:"GET"
    })
    .then(function(response) {
      $log.info(response)

      var dates = Object.keys(response.data["Technical Analysis: RSI"]).slice(0,112)
      var values = Object.values(Object.values(response.data["Technical Analysis: RSI"]).slice(0,112)).map(function(value){
        return parseFloat(value["RSI"])
      })

      var title = {
         text: "Relative Strength Index: RSI"
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
          text: "RSI"
         }
      };   
      var series =  [{
        name: symbol,
        data: values
         }
      ];
      var json = {};
      json.title = title;
      json.subtitle = subtitle;
      json.xAxis = xAxis;
      json.yAxis = yAxis;
      json.series = series;
      Highcharts.chart('RSI-Chart', json);

      return response.data

    });
  }
  function makeADX(symbol) {
    $http({
      url: BACKEND_URL + "/indicator/ADX/" + symbol,
      method:"GET"
    })
    .then(function(response) {
      $log.info(response)
      var dates = Object.keys(response.data["Technical Analysis: ADX"]).slice(0,112)
      var values = Object.values(Object.values(response.data["Technical Analysis: ADX"]).slice(0,112)).map(function(value){
        return parseFloat(value["ADX"])
      })

      var title = {
         text: "Average Directional Movement Index: ADX"
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
          text: "ADX"
         }
      };   
      var series =  [{
        name: symbol,
        data: values
         }
      ];
      var json = {};
      json.title = title;
      json.subtitle = subtitle;
      json.xAxis = xAxis;
      json.yAxis = yAxis;
      json.series = series;
      Highcharts.chart('ADX-Chart', json);

      return response.data

    });
  }
  function makeCCI(symbol) {
    $http({
      url: BACKEND_URL + "/indicator/CCI/" + symbol,
      method:"GET"
    })
    .then(function(response) {
      var dates = Object.keys(response.data["Technical Analysis: CCI"]).slice(0,112)
      var values = Object.values(Object.values(response.data["Technical Analysis: CCI"]).slice(0,112)).map(function(value){
        return parseFloat(value["CCI"])
      })

      var title = {
         text: "Commodity Channel Index (CCI)"
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
          text: "CCI"
         }
      };   
      var series =  [{
        name: symbol,
        data: values
         }
      ];
      var json = {};
      json.title = title;
      json.subtitle = subtitle;
      json.xAxis = xAxis;
      json.yAxis = yAxis;
      json.series = series;
      Highcharts.chart('CCI-Chart', json);

      return response.data

    });
  }
  function makeSTOCH(symbol) {
    $http({
      url: BACKEND_URL + "/indicator/STOCH/" + symbol,
      method:"GET"
    })
    .then(function(response) {

      var dates = Object.keys(response.data["Technical Analysis: STOCH"]).slice(0,112)
      var slowDValues = Object.values(Object.values(response.data["Technical Analysis: STOCH"]).slice(0,112)).map(function(value){
        return parseFloat(value["SlowD"])
      })
      var slowKValues = Object.values(Object.values(response.data["Technical Analysis: STOCH"]).slice(0,112)).map(function(value){
        return parseFloat(value["SlowK"])
      })
      var title = {
         text: "Stochastic (STOCH)"
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
          text: "STOCH"
         }
      };   
      var series =  [{
        name: symbol + " SlowD",
        data: slowDValues
        },
        {
        name: symbol + " SlowK",
        data: slowKValues
        }
      ];
      var json = {};
      json.title = title;
      json.subtitle = subtitle;
      json.xAxis = xAxis;
      json.yAxis = yAxis;
      json.series = series;
      Highcharts.chart('STOCH-Chart', json);

      return response.data

    });
  }
  function makeBBANDS(symbol) {
    $http({
      url: BACKEND_URL + "/indicator/BBANDS/" + symbol,
      method:"GET"
    })
    .then(function(response) {

      var dates = Object.keys(response.data["Technical Analysis: BBANDS"]).slice(0,112)
      var lower = Object.values(Object.values(response.data["Technical Analysis: BBANDS"]).slice(0,112)).map(function(value){
        return parseFloat(value["Real Lower Band"])
      })
      var middle = Object.values(Object.values(response.data["Technical Analysis: BBANDS"]).slice(0,112)).map(function(value){
        return parseFloat(value["Real Middle Band"])
      })
      var higher = Object.values(Object.values(response.data["Technical Analysis: BBANDS"]).slice(0,112)).map(function(value){
        return parseFloat(value["Real Higher Band"])
      })      
      var title = {
         text: "Bollinger Bands (BBANDS)"
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
          text: "BBANDS"
         }
      };   
      var series =  [{
        name: symbol + " Real Lower Band",
        data: lower
        },
        {
        name: symbol + " Real Middle Band",
        data: middle
        },
        {
        name: symbol + " Real Higher Band",
        data: higher
        }
      ];
      var json = {};
      json.title = title;
      json.subtitle = subtitle;
      json.xAxis = xAxis;
      json.yAxis = yAxis;
      json.series = series;
      Highcharts.chart('BBANDS-Chart', json);

      return response.data

    });
  }
  function makeMACD(symbol) {
    $http({
      url: BACKEND_URL + "/indicator/MACD/" + symbol,
      method:"GET"
    })
    .then(function(response) {

      var dates = Object.keys(response.data["Technical Analysis: MACD"]).slice(0,112)
      var signal = Object.values(Object.values(response.data["Technical Analysis: MACD"]).slice(0,112)).map(function(value){
        return parseFloat(value["MACD_Signal"])
      })
      var hist = Object.values(Object.values(response.data["Technical Analysis: MACD"]).slice(0,112)).map(function(value){
        return parseFloat(value["MACD_Hist"])
      })
      var macd = Object.values(Object.values(response.data["Technical Analysis: MACD"]).slice(0,112)).map(function(value){
        return parseFloat(value["MACD"])
      })      
      var title = {
         text: "Moving Average Convergence/Divergence (MACD)"
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
          text: "MACD"
         }
      };   
      var series =  [{
        name: symbol + " MACD_Signal",
        data: signal
        },
        {
        name: symbol + " MACD_Hist",
        data: hist
        },
        {
        name: symbol,
        data: macd
        }
      ];
      var json = {};
      json.title = title;
      json.subtitle = subtitle;
      json.xAxis = xAxis;
      json.yAxis = yAxis;
      json.series = series;
      Highcharts.chart('MACD-Chart', json);

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


      makeSMA($scope.symbol)
      makeEMA($scope.symbol)
      makeRSI($scope.symbol)
      makeADX($scope.symbol)
      makeCCI($scope.symbol)
      makeSTOCH($scope.symbol)
      makeBBANDS($scope.symbol)
      makeMACD($scope.symbol)

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
}

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

    $log.info($scope);
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
          stock['changePercent'] = Math.round(today["4. close"] - yesterday["4. close"] / yesterday["4. close"] * 100) / 100
          stock['volume'] = today["5. volume"]
          stock['stockPrice'] = Number(today["4. close"]).toFixed(2)
          
          $scope.favorites.push(stock)
          return stock
        })
      })
    }
  }
  self.showDetail = function(response) {
    $scope.view.slide='right'
    var isFavorite = false;


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
    $scope.symbol = metadata["2. Symbol"]
    $scope.change = Number(today["4. close"] - yesterday["4. close"]).toFixed(2)
    $scope.changePercent = Math.round(today["4. close"] - yesterday["4. close"] / yesterday["4. close"] * 100) / 100
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

    $log.info("prices: " + prices)
    $log.info("volumes: " + volumes)

    // fields where trading hours matter
    $scope.close = Number(today["4. close"]).toFixed(2)  
    $timeout(function() {
      // inject favorite star
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
      Highcharts.chart('priceChart', {
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

          showLastLabel: true
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
        legend: {
          layout: 'vertical',
          align: 'right',
          verticalAlign: 'middle'
        },

        series: [{
          marker: {
            enabled: false,
          },
          name: $scope.symbol,
          data: prices,
          color: '#ff5b5e'

        },
        {
          yAxis: 1,
          type: "column",
          name: $scope.symbol+ " Volume",
          data: $scope.volumes,
          color: '#ffffff'
        }],

      });
    })  
  }


  self.updateFavorites = function(symbol) {
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

  self.getQuote = function(symbol) {
    $http({
      url: BACKEND_URL + "/price/" + symbol,
      method: "GET",
    })
    .then(function(response) {
      self.showDetail(response)
          
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
  
  
  

  
}
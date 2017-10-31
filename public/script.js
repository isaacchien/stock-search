
var BACKEND_URL = "http://localhost:3000"

var app = angular
  .module('firstApplication', ['ngMaterial', 'ngMessages', 'ngAnimate'])
  .controller('autoCompleteController', autoCompleteController)
  // .constant("$MD_THEME_CSS","");

function autoCompleteController ($timeout, $q, $log, $http, $scope) {
  var self = this;  
  // list of states to be displayed
  self.states = loadStates();
  self.selectedItemChange = selectedItemChange;
  
  self.results = [];
  $scope.favorites = [];
  self.addFavorite = function(symbol) {
    $scope.favorites.push(symbol)
    $log.info("favorites: " + $scope.favorites)
  }

  self.getQuote = function(symbol) {
    $http({
      url: BACKEND_URL + "/price/" + symbol,
      method: "GET",
    })
    .then(function(response) {
      // return response.data
      $scope.view.slide = 'right'
      var metadata = response.data["Meta Data"]
      var timeseries = response.data["Time Series (Daily)"]
      var dates = Object.keys(timeseries).slice(0, 112)
      var prices = dates.map(function(date){
        return timeseries[date]["4. close"]
      })
      $scope.volumes = dates.map(function(date){
        return timeseries[date]["5. volume"]
      })
      var today = timeseries[dates[0]]
      var yesterday = timeseries[dates[1]]

      // fields where trading hours don't matter
      $scope.symbol = symbol.toUpperCase()
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

      // fields where trading hours matter
      $scope.close = Number(today["4. close"]).toFixed(2)

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
  
  
  function selectedItemChange(item) {
     $log.info('Item changed to ' + JSON.stringify(item));
  }
  
  //build list of states as map of key-value pairs
  function loadStates() {
     var allStates = 'Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware,\
        Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana,\
        Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana,\
        Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina,\
        North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina,\
        South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia,\
        Wisconsin, Wyoming';
        
     return allStates.split(/, +/g).map( function (state) {
        return {
           value: state.toLowerCase(),
           display: state
        };
     });
  }
  
  //filter function for search query
  function createFilterFor(query) {
     var lowercaseQuery = angular.lowercase(query);
     return function filterFn(state) {
        return (state.value.indexOf(lowercaseQuery) === 0);
     };
  }
}
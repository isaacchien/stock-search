var BACKEND_URL = "http://localhost:3000"

var app = angular
  .module('firstApplication', ['ngMaterial', 'ngMessages', 'ngAnimate'])
  .controller('autoCompleteController', autoCompleteController)
  // .constant("$MD_THEME_CSS","");

function autoCompleteController ($timeout, $q, $log, $http, $scope) {
  var self = this;  
  // list of states to be displayed
  self.states        = loadStates();
  self.selectedItemChange = selectedItemChange;
  
  self.results = [];

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
      var dates = Object.keys(timeseries)
      var today = timeseries[dates[0]]
      var yesterday = timeseries[dates[1]]

      var offset = -5;
      var now = new Date().toLocaleString("en-US", {timeZone: "America/New_York"})



      $log.info('date: ' + now);


      $scope.symbol = symbol
      $scope.timestamp = metadata["3. Last Refreshed"]
      $scope.change = (today["4. close"] - yesterday["4. close"])
      $scope.changePercent = $scope.change / yesterday["4. close"]
      $scope.open = today["1. open"]
      $scope.close = today["4. close"]
      $scope.range = today["3. low"] + " - " + today["2. high"]
      $scope.volume = today["5. volume"]
      return response.data;
    });

  }


  self.querySearch = function (query) {
    $log.info('Text changed to ' + query);

    self.results = $http({
      url: BACKEND_URL + "/search",
      method: "GET",
      params: {query}
    })
    .then(function(response) {
      // return response.data

      var results = response.data.map(d => (d));
      $log.info(results)

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
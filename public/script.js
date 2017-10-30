var BACKEND_URL = "http://localhost:3000"

// var app = angular
//   .module('myApp', ['ngMaterial', 'ngMessages', 'material.svgAssetsCache'])
  // .controller('DemoCtrl', DemoCtrl);





// app.directive('myDirective', function() {
//     return {
//         require: 'ngModel',
//         link: function(scope, element, attr, mCtrl) {
//             function myValidation(value) {
//                 if (value.indexOf(' ') >= 0) {
//                     mCtrl.$setValidity('whitespace', false);
//                 } else {
//                     mCtrl.$setValidity('whitespace', true);
//                 }
//                 return value;
//             }
//             mCtrl.$parsers.push(myValidation);
//         }
//     };
// });


var app = angular
  .module('firstApplication', ['ngMaterial', 'ngMessages'])
  .controller('autoCompleteController', autoCompleteController);
  // .constant("$MD_THEME_CSS","");

function autoCompleteController ($timeout, $q, $log, $http) {
  var self = this;  
  // list of states to be displayed
  self.states        = loadStates();
  self.selectedItemChange = selectedItemChange;
  
  self.results = [];

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
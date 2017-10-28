var app = angular.module('myApp', []);

app.directive('myDirective', function() {
    return {
        require: 'ngModel',
        link: function(scope, element, attr, mCtrl) {
            function myValidation(value) {
                if (value.indexOf(' ') >= 0) {
                    mCtrl.$setValidity('whitespace', false);
                } else {
                    mCtrl.$setValidity('whitespace', true);
                }
                return value;
            }
            mCtrl.$parsers.push(myValidation);
        }
    };
});


app.controller('formCtrl', function($scope) {
	$scope.submitForm = function(isValid) {

		// check to make sure the form is completely valid
		if (isValid) {
			alert('our form is amazing');
		}

	};
});

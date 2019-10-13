/* Angular Module Definition */
var myApp = angular.module('myModule', ['oitozero.ngSweetAlert']);

/* File Upload Directive */
myApp.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function () {
                scope.$apply(function () {
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

/* File Upload Service */
myApp.service('fileUpload', ['$http', '$window', function ($http, $window) {
	return {
		uploadFileAndFieldsToUrl: function(file, data, uploadUrl) {
			var fd = new FormData();
			fd.append('file', file);		
			fd.append('data', JSON.stringify(data));
			return $http.post(uploadUrl, fd, {headers: {'Content-Type': undefined}, transformRequest: angular.identity});
		}
	};
}]);

/* Upload Product Details To DB Controller */
myApp.controller('addProductToCloudant', ['SweetAlert', '$scope', 'fileUpload', '$http', '$filter', '$window', function (SweetAlert, $scope, fileUpload, $http, $filter, $window) {
    $scope.isDisabled = false;
	
	$scope.userId = $window.sessionStorage.getItem('_id');
	
	$scope.accountId = $window.sessionStorage.getItem('accountId')
	
	$scope.productId = Date.now();
	
	$scope.category = ["shoe", "sandels"];

	$scope.confirm = function(title, text, type){
		SweetAlert.swal({title: title, text: text, type: type},function(){ 
						$window.location.reload();
				   });
    }
	
	$scope.error = function(title, text, type){
		SweetAlert.swal({title: title, text: text, type: type},function(){ 
						$window.location.reload();
				   });
    }
	
    $scope.$watch('myFile', function (newFileObj) {
        if (newFileObj)
            $scope.filename = newFileObj.name;
    });
	
    var productData = {
        _id: '',
        productCategory: '',
        productCost: '',
        productDescription: '',
        productFileName: '',
		fileBase64Data: '',
		productQuantity: '',
		productSize: '',
		accountId: '',
    };

    $scope.productData = productData;	

    $scope.addProductDetailsToCloudant = function () {
        $scope.isDisabled = true;

		var file = $scope.myFile;
        $scope.productData.productFileName = file.name;
		$scope.productData.productDescription = $scope.productDescription;
		$scope.productData.productCost = $scope.productCost;
		$scope.productData.productCategory = $scope.categoryName;
		$scope.productData._id = $scope.productId + '';
		$scope.productData.productQuantity = $scope.productQuantity;
		$scope.productData.productSize = $scope.productSize + '';
		$scope.productData.accountId = $scope.accountId + '';
        var uploadUrl = "/addProductDataToDB";
		fileUpload.uploadFileAndFieldsToUrl(file, $scope.productData, uploadUrl).then(function (uploadResponse) {
			if(uploadResponse.data.response && uploadResponse.data.success)
				$scope.confirm('Data uploaded successfully with id '+uploadResponse.data.response.id, '', 'success');
			else
				$scope.error(uploadResponse.data.message, '', 'error')
		});
	}

	$scope.logout = function () {
		$window.location.href = '/index.html';
	}
		
}]);

/* Insert/Verify User Details To DB Controller */
myApp.controller('loginForm', ['SweetAlert', '$scope', 'fileUpload', '$http', '$filter', '$window', function (SweetAlert, $scope, fileUpload, $http, $filter, $window) {
	
	$scope.showLogin = true;
	
	$scope.showSignUp = false;	
	
    $scope.showSignupForm = function () {
		$scope.showLogin = false;
		$scope.showSignUp = true;
	}
	
    $scope.showLoginForm = function () {
		$scope.showLogin = true;
		$scope.showSignUp = false;
	}
	
	$scope.confirm = function(title, text, type){
		SweetAlert.swal({title: title, text: text, type: type},function(){ 
						$window.location.reload();
				   });
    }

	$scope.error = function(title, text, type){
		SweetAlert.swal({title: title, text: text, type: type},function(){ 
						$window.location.reload();
				   });
    }

    $scope.registerUser = function () {
		var userDetails = {	
			_id: $scope.emailId,
			fullName: $scope.fullName,
			password: $scope.password,
			accountId: 'A-'+Date.now()
		}
		var data = {
			data: userDetails
		}				
		$http({
			method: 'POST',
			url: '/addUserDataToDB',
			data: data
		}).then(function successCallback(response) {
			if (response.data.success == true) {
                $scope.confirm('User successfully registered !!', '', 'success');
            }else {
				$scope.error(response.data.message, '', 'error');
            }
		});
	};
	
    $scope.verifyUserLogin = function () {
		var loginDetails = {	
			_id: $scope.loginId,
			password: $scope.loginPassword
		}
		var data = {
			data: loginDetails
		}				
		$http({
			method: 'POST',
			url: '/verifyLogin',
			data: data
		}).then(function successCallback(response) {
			if (response.data.success == true) {
				$window.sessionStorage.setItem("userId", response.data.response._id);
				$window.sessionStorage.setItem("accountId", response.data.response.accountId);
                $window.location.href = '/upload.html';
            }else {
                $scope.error(response.data.message, '', 'error');
            }
		});
	};
		
}]);
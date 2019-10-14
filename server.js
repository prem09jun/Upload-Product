var express = require('express');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var port = process.env.PORT || process.env.VCAP_APP_PORT || '8080';
var app = express();
var multer = require('multer');
var Cloudant = require('@cloudant/cloudant');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
var upload = multer({
    dest: __dirname + '/upload'
});
var type = upload.single('file');

app.use('/', express.static(__dirname + '/'));

var cloudantUserName = '57034c71-949b-496a-a201-c531d9e0f5b3-bluemix';
var cloudantPassword = '4ba5f7b783631c8538f18f50773288414d5ff1edbe0a5dd0dfe9b29543a2dfd6';
var cloudant_url = 'https://' + cloudantUserName + ':' + cloudantPassword + '@' + cloudantUserName + '.cloudant.com';
var cloudant = Cloudant(cloudant_url);
var dbForUserInfo = cloudant.db.use('user_info');
var dbForProductInfo = cloudant.db.use('product_info');

//Starting page when server starts
app.get('/', function (req, res) {
    console.log('Open index.html page');
    res.sendFile(path.join(__dirname + '/index.html'));
});
//Create index on product db for product category field if not existing
var productCategory = {
    name: 'productCategory',
    type: 'json',
    index: {
        fields: ['productCategory']
    }
};
dbForProductInfo.index(productCategory, function (er, response) {
    if (er) console.log('Error creating index on product category : ' + er);
    else console.log('Index creation result on product category : ' + response.result);
});
//Create index on order db for userId field if not existing
var userId = {
    name: '_id',
    type: 'json',
    index: {
        fields: ['_id']
    }
};
dbForUserInfo.index(userId, function (er, response) {
    if (er) console.log('Error creating index on userId : ' + er);
    else console.log('Index creation result on userId : ' + response.result);
});
//Add product data to DB
app.post('/addProductDataToDB', type, function (req, res) {
    console.log('Inside Express api to insert details about product');
    var productData = JSON.parse(JSON.stringify(req.body.data));
    productData = JSON.parse(productData);
	var fileData = fs.readFileSync(__dirname + '/upload/' + req.file.filename, 'base64');
	productData.fileBase64Data = fileData;
	insertProductData(productData).then(function (data) {
	if (data.success){
		fs.unlink(__dirname + '/upload/' + req.file.filename, function (err) {
			if (!err)
				console.log('File deleted !');
			else 
				console.log('Issue deleting File');
		});
		res.json({ success: true, message: 'Product data inserted successfully !', response: data.response });	
	}else
		res.json({ success: false, message: 'Issue inserting product data !' });				
	});
});
//Add user data to DB
app.post('/addUserDataToDB', type, function (req, res) {
    console.log('Inside Express api to insert details about user');
    var userData = req.body.data;
	getLoginDetails().then(function (data) {
		if(data.success){
			res.json({ success: false, message: 'User already exists with same email Id, use another Id to register !' });
		}else{
			insertUserData(userData).then(function (data) {
			if (data.success){
				res.json({ success: true, message: 'User data inserted successfully !', response: data.response });	
			}else
				res.json({ success: false, message: 'Issue inserting user data !' });				
			});			
		}
	}
});
//Verify login with user email id from DB
app.post('/verifyLogin', type, function (req, res) {
    console.log('Inside Express api to get verify login data');
	var loginDetails = req.body.data;
    getLoginDetails(loginDetails._id).then(function (data) {
        if (data.success && data.response && data.response.docs && data.response.docs.length > 0) {
			var userDetails = data.response.docs[0];
			if(loginDetails.password === userDetails.password)
				res.json({success: true, message: 'User verification successfully ! ', response: userDetails});
			else
				res.json({success: false, message: 'Password does not match with the user id ! '});
        } else res.json({
            success: false,
            message: 'User id not valid or registered !'
        });
    });
});
// Insert data/record in cloudant DB
var insertProductData = async (data) => {
    try {
		var data = await dbForProductInfo.insert(data);
		console.log('Product Info Inserted !');
		return ({
			success: true,
			message: 'Product Info Inserted Successfully !',
			response: data
		});
    } catch (err) {
        console.log('Issue fetching/inserting data from DB ! ' + err);
        return ({
            success: false,
            message: 'Issue fetching/inserting data from DB !'
        });
    }
}
// Insert user details in cloudant DB
var insertUserData = async (data) => {
    try {
		var data = await dbForUserInfo.insert(data);
		console.log('User Info Inserted !');
		return ({
			success: true,
			message: 'User Info Inserted Successfully !',
			response: data
		});
    } catch (err) {
        console.log('Issue fetching/inserting data from DB ! ' + err);
        return ({
            success: false,
            message: 'Issue fetching/inserting data from DB !'
        });
    }
}
// Verify user details in cloudant DB
var verifyUserData = async (data) => {
    try {
		var data = await dbForUserInfo.insert(data);
		console.log('User Info Inserted !');
		return ({
			success: true,
			message: 'User Info Inserted Successfully !',
			response: data
		});
    } catch (err) {
        console.log('Issue fetching/inserting data from DB ! ' + err);
        return ({
            success: false,
            message: 'Issue fetching/inserting data from DB !'
        });
    }
}
//Verify login details based on email id from cloudant DB
var getLoginDetails = async (emailId) => {
    try {
        var response = await dbForUserInfo.find({
            selector: {
                _id: emailId
            }
        });
        console.log('User data found successfully ! ');
        return ({
            success: true,
            message: 'User data found successfully ! ',
            response: response
        });
    } catch (err) {
        console.log('User data not present/DB issue ! ' + err);
        return ({
            success: false,
            message: 'User data not present/DB issue !'
        });
    }
}
app.listen(port);

var express = require('express'); //import express 
var bodyParser = require('body-parser');
var firebase = require('firebase');
var app = express();
app.use(bodyParser.json()); //need to parse HTTP request body

const { apiKey_env, authDomain_env, databaseURL_env, projectId_env, storageBucket_env, messagingSenderId_env } = require('./config');

var config = {
  apiKey: apiKey_env,
  authDomain: authDomain_env,
  databaseURL: databaseURL_env,
  projectId: projectId_env,
  storageBucket: storageBucket_env,
  messagingSenderId: messagingSenderId_env
};
firebase.initializeApp(config);

//Fetch instances
app.get('/', function (req, res) {
    
    console.log("HTTP Get Request");
    console.log(req.body);
    console.log("apikey: " + apiKey_env);

    var collection_name = req.body.collection_name;
    var filter_by = req.body.filter_by;
    var filter_value = req.body.filter_value;

    var userReference = firebase.database().ref('/'+collection_name+'/')
    .orderByChild(filter_by)
    .startAt(filter_value)
    .endAt(filter_value + "\uf8ff");

	//Attach an asynchronous callback to read the data
	userReference.on("value", 
			  function(snapshot) {
                  var updates = {}
                    snapshot.forEach(function(child) {
                        var agent = child.val();
                        console.log(agent);
                    });
					res.json(snapshot.val());
					userReference.off("value");
					}, 
			  function (errorObject) {
					console.log("The read failed: " + errorObject.code);
					res.send("The read failed: " + errorObject.code);
			 });
});

//Create new instance
app.put('/', function (req, res) {

    console.log("HTTP Put Request");
    
    var collection_name = req.body.collection_name;
	var username = req.body.username;
	var name = req.body.name;
    var age = req.body.age;
    var user_type = req.body.user_type;

	var referencePath = '/'+collection_name+'/'+username+'/';
	var userReference = firebase.database().ref(referencePath);
	userReference.set({Name: name, Age: age, user_type: user_type}, 
				 function(error) {
					if (error) {
						res.send("Data could not be saved." + error);
					} 
					else {
						res.send("Data saved successfully.");
					}
			});
});


//Update existing instance
app.post('/', function (req, res) {

	console.log("HTTP POST Request");

    var collection_name = req.body.collection_name;
	var username = req.body.username;
	var name = req.body.name;
	var age = req.body.age;

	var referencePath = '/'+collection_name+'/'+username+'/';
	var userReference = firebase.database().ref(referencePath);
	userReference.update({Name: name, Age: age}, 
				 function(error) {
					if (error) {
						res.send("Data could not be updated." + error);
					} 
					else {
						res.send("Data updated successfully.");
					}
			    });
});

//Bulk Update existing instance
app.post('/bulk_replace', function (req, res) {

	console.log("HTTP POST Request");
    
    var collection_name = req.body.collection_name;
    var filter_by = req.body.filter_by;
    var filter_value = req.body.filter_value;
    var new_value = req.body.new_value;

    var refPath = '/'+collection_name+'/'
    var userReference = firebase.database().ref(refPath)
        .orderByChild(filter_by)
        .startAt(filter_value)
        .endAt(filter_value + "\uf8ff");

	//Attach an asynchronous callback to read the data
	userReference.on("value", 
			  function(snapshot) {
                var updates = {}
                snapshot.forEach(function(child) {
                    var agent = child.val();
                    updates["/" + child.key + "/" + filter_by] = new_value;
                });
                firebase.database().ref(refPath).update(updates);
                res.json(snapshot.val());
                userReference.off("value");
	});

});

//Bulk add attribute value to lowercase (allow search in firebase without case sensitive and special characters)
app.post('/bulk_text_lowercase', function (req, res) {

	console.log("HTTP POST Request");
    
    var collection_name = req.body.collection_name;
    var text_by = req.body.text_by;
    var new_attribute = req.body.new_attribute;

    var refPath = '/'+collection_name+'/'
    var userReference = firebase.database().ref(refPath);

	//Attach an asynchronous callback to read the data
	userReference.on("value", 
			  function(snapshot) {
                var updates = {}
                snapshot.forEach(function(child) {
                    var agent = child.val();
                    console.log(agent);
                    if (agent[text_by])
                        updates["/" + child.key + "/" + new_attribute] = agent[text_by].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                });
                firebase.database().ref(refPath).update(updates);
                res.json(snapshot.val());
                userReference.off("value");
	});

});

//Bulk copy attribute to a new attribute depending in conditions
app.post('/bulk_copy_attribute', function (req, res) {

	console.log("HTTP POST Request");
    
    var collection_name = req.body.collection_name;
    var filter_by = req.body.filter_by; //attribute to move
    var conditions = req.body.conditions; //conditions of the attribute value
    var new_attribute_name = req.body.new_attribute_name; //atribute where will be copy

    var refPath = '/'+collection_name+'/'
    var userReference = firebase.database().ref(refPath);

	//Attach an asynchronous callback to read the data
	userReference.on("value", 
			  function(snapshot) {
                var updates = {}
                snapshot.forEach(function(child) {
                    var agent = child.val();
                    if (agent[filter_by])
                        updates["/" + child.key + "/" + new_attribute_name] = agent[filter_by];
                });
                firebase.database().ref(refPath).update(updates);
                res.json(snapshot.val());
                userReference.off("value");
	});

});

//Delete an instance
app.delete('/', function (req, res) {

   console.log("HTTP DELETE Request");
   //todo
});

var server = app.listen(8080, function () {
  
   var host = server.address().address;
   var port = server.address().port;
   
   console.log("Example app listening at http://%s:%s", host, port);
});

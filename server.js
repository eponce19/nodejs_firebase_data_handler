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
console.log("------");
console.log(config);
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
        .limitToLast(200)
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
                    console.log(collection_name + " Updated:" + child.key);
                });
                firebase.database().ref(refPath).update(updates);
                console.log(updates);

                // res.json("Collection updated");
                // userReference.off("value");
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
                    if (agent[text_by]){
                      updates["/" + child.key + "/" + new_attribute] = agent[text_by].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                    }
                });
                firebase.database().ref(refPath).update(updates);
                console.log(updates);
                // res.json("Patients updated");
                // userReference.off("value");
	});

});

//Bulk copy attribute to a new attribute depending in conditions
app.post('/bulk_copy_treatment', function (req, res) {

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
                    if (agent[filter_by]){
                      if ((agent[filter_by] == "Metotrexate" ||
                      agent[filter_by] == "Cloroquina" ||
                      agent[filter_by] == "Hidroxicloroquina" ||
                      agent[filter_by] == "Sulfazalazina" ||
                      agent[filter_by] == "Leflunomida" ||
                      agent[filter_by] == "Mofetil micofenolato" ||
                      agent[filter_by] == "Azatioprina" ||
                      agent[filter_by] == "Ciclofosfamida" ||
                      agent[filter_by] == "Tacrolimus" ||
                      agent[filter_by] == "Biológico" ||
                      agent[filter_by] == "Inhibidor JAK" ||
                      agent[filter_by] == "Otro") != true){
                        updates["/" + child.key + "/" + new_attribute_name] = agent[filter_by];
                        updates["/" + child.key + "/" + filter_by] = "Otro";
                        // console.log(agent["fullName"]);
                      }
                    }
                });
                firebase.database().ref(refPath).update(updates);
                console.log(updates);
                // res.json(snapshot.val());
                // userReference.off("value");
	});

});

//Bulk copy attribute to a new attribute depending in conditions
app.post('/bulk_copy_scale', function (req, res) {

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
                    if (agent[filter_by]){
                      if ((
                        agent[filter_by] == "DAS28 VSG" || agent[filter_by] == "DAS28 PCR" || agent[filter_by] == "SDAI" ||
                        agent[filter_by] == "CDAI" ||
                        agent[filter_by] == "BASDAI" ||
                        agent[filter_by] == "BASMI" ||
                        agent[filter_by] == "SLEDAI" ||
                        agent[filter_by] == "BVAS" ||
                        agent[filter_by] == "RODNAN" ||
                        agent[filter_by] == "WOMAC" ||
                        agent[filter_by] == "FIQ" ||
                        agent[filter_by] == "MMT8" ||
                        agent[filter_by] == "Otro") != true){
                        updates["/" + child.key + "/" + new_attribute_name] = agent[filter_by];
                        updates["/" + child.key + "/" + filter_by] = "Otro";
                        console.log(agent["fullName"]);
                      }
                    }
                });
                firebase.database().ref(refPath).update(updates);
                // console.log(updates);
                // res.json(snapshot.val());
                // userReference.off("value");
	});

});


//Bulk copy attribute to a new attribute depending in conditions
app.post('/bulk_copy_creation_date', function (req, res) {

	console.log("HTTP POST Request");

    var collection_name = req.body.collection_name;
    var filter_by = req.body.filter_by; //attribute to move
    var conditions = req.body.conditions; //conditions of the attribute value

    var refPath = '/'+collection_name+'/'
    var userReference = firebase.database().ref(refPath);

	//Attach an asynchronous callback to read the data
	userReference.on("value",
			  function(snapshot) {
                var updates = {}
                snapshot.forEach(function(child) {
                    var agent = child.val();
                    if (agent[filter_by]){
                        var creationDate = new Date(agent[filter_by]);
                        var miliseconds = creationDate.getTime();
                        // updates["/" + child.key + "/creationDateMiliseconds" ] = miliseconds;
                        // updates["/" + child.key + "/creationDate"] = agent[filter_by];
                        updates["/" + child.key + "/lastConsultationDateMiliseconds"] = miliseconds;
                        console.log(agent["fullName"] + " " + agent[filter_by]);
                    }
                });
                firebase.database().ref(refPath).update(updates);
                // console.log(updates);
                // res.json(snapshot.val());
                // userReference.off("value");
	});

});

//Bulk copy attribute to a new attribute depending in conditions
app.post('/bulk_copy_diagnosis', function (req, res) {

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
                    if (agent[filter_by]){
                      if ((
                        agent[filter_by] == "Artritis reumatoide" ||
                        agent[filter_by] == "Lupus eritematoso sistémico" ||
                        agent[filter_by] == "Síndrome de Sjögren" ||
                        agent[filter_by] == "Esclerosis sistémica difusa" ||
                        agent[filter_by] == "Esclerosis sistémica localizada" ||
                        agent[filter_by] == "Osteoartritis" ||
                        agent[filter_by] == "Fibromialgia" ||
                        agent[filter_by] == "Espondiloartritis" ||
                        agent[filter_by] == "Artritis psoriásica" ||
                        agent[filter_by] == "Síndrome antifosfolípidos" ||
                        agent[filter_by] == "Vasculitis ANCA" ||
                        agent[filter_by] == "Vasculitis" ||
                        agent[filter_by] == "Enfermedad mixta del tejido conectivo" ||
                        agent[filter_by] == "Polimiositis" ||
                        agent[filter_by] == "Dermatomiositis" ||
                        agent[filter_by] == "Síndrome antisintetasa" ||
                        agent[filter_by] == "Artritis indiferenciada" ||
                        agent[filter_by] == "Artritis idiopática juvenil" ||
                        agent[filter_by] == "Artropatía por cristales" ||
                        agent[filter_by] == "Fenoméno de Raynaud primario" ||
                        agent[filter_by] == "Enfermedad de Still del Adulto" ||
                        agent[filter_by] == "Artritis Reactiva" ||
                        agent[filter_by] == "Enfermedad de Lyme" ||
                        agent[filter_by] == "Enfermedad por IgG4" ||
                        agent[filter_by] == "Otro") != true){
                        updates["/" + child.key + "/" + new_attribute_name] = agent[filter_by];
                        updates["/" + child.key + "/" + filter_by] = "Otro";
                        console.log(agent["fullName"]);
                      }
                    }
                });
                firebase.database().ref(refPath).update(updates);
                // console.log(updates);
                // res.json(snapshot.val());
                // userReference.off("value");
	});

});


//Bulk copy attribute to a new collection
app.post('/bulk_copy_radiography', function (req, res) {

	console.log("HTTP POST Request");

    var collection_origin = req.body.collection_origin;
    var collection_destination = req.body.collection_destination;

    var refPathOrigin = '/'+collection_origin+'/'
    var refPathDestination = '/'+collection_destination+'/'
    var userReference = firebase.database().ref(refPathOrigin);

	//Attach an asynchronous callback to read the data
	userReference.on("value",
			  function(snapshot) {
                var updates = {}
                snapshot.forEach(function(child) {
                    var agent = child.val();

                      if (agent["handRadiography"]){
                        updates["/"+child.key+"/typeSelected"] = "Mano";
                        updates["/"+child.key+"/patientKey"] = agent["patientKey"];
                        updates["/"+child.key+"/creationDate"] = agent["handRadiographyLast"];
                        updates["/"+child.key+"/findings"] = agent["handRadiographyFindings"];
                        console.log(updates);
                        firebase.database().ref(refPathDestination).update(updates);

                      }
                      if (agent["footRadiography"]) {
                        updates["/"+child.key+"/typeSelected"] = "Pie";
                        updates["/"+child.key+"/patientKey"] = agent["patientKey"];
                        updates["/"+child.key+"/creationDate"] = agent["footRadiographyLast"];
                        updates["/"+child.key+"/findings"] = agent["footRadiographyFindings"];
                        console.log(updates);
                        firebase.database().ref(refPathDestination).update(updates);

                      }
                      if (agent["other1Radiography"]){
                        updates["/"+child.key+"/typeSelected"] = "Otro";
                        updates["/"+child.key+"/typeSelectedDefine"] = agent["other1RadiographyType"];
                        updates["/"+child.key+"/patientKey"] = agent["patientKey"];
                        updates["/"+child.key+"/creationDate"] = agent["other1RadiographyDate"];
                        updates["/"+child.key+"/findings"] = agent["other1RadiographyFindings"];
                        console.log(updates);
                        firebase.database().ref(refPathDestination).update(updates);
                      }

                      if (agent["other2Radiography"]){
                        updates["/"+child.key+"/typeSelected"] = "Otro";
                        updates["/"+child.key+"/typeSelectedDefine"] = agent["other2RadiographyType"];
                        updates["/"+child.key+"/patientKey"] = agent["patientKey"];
                        updates["/"+child.key+"/creationDate"] = agent["other2RadiographyDate"];
                        updates["/"+child.key+"/findings"] = agent["other2RadiographyFindings"];
                        console.log(updates);
                        firebase.database().ref(refPathDestination).update(updates);
                      }
                      if (agent["other3Radiography"]){
                        updates["/"+child.key+"/typeSelected"] = "Otro";
                        updates["/"+child.key+"/typeSelectedDefine"] = agent["other3RadiographyType"];
                        updates["/"+child.key+"/patientKey"] = agent["patientKey"];
                        updates["/"+child.key+"/creationDate"] = agent["other3RadiographyDate"];
                        updates["/"+child.key+"/findings"] = agent["other3RadiographyFindings"];
                        console.log(updates);
                        firebase.database().ref(refPathDestination).update(updates);
                      }
                      if (agent["other4Radiography"]){
                        updates["/"+child.key+"/typeSelected"] = "Otro";
                        updates["/"+child.key+"/typeSelectedDefine"] = agent["other4RadiographyType"];
                        updates["/"+child.key+"/patientKey"] = agent["patientKey"];
                        updates["/"+child.key+"/creationDate"] = agent["other4RadiographyDate"];
                        updates["/"+child.key+"/findings"] = agent["other4RadiographyFindings"];
                        console.log(updates);
                        firebase.database().ref(refPathDestination).update(updates);
                      }
                      if (agent["other5Radiography"]){
                        updates["/"+child.key+"/typeSelected"] = "Otro";
                        updates["/"+child.key+"/typeSelectedDefine"] = agent["other5RadiographyType"];
                        updates["/"+child.key+"/patientKey"] = agent["patientKey"];
                        updates["/"+child.key+"/creationDate"] = agent["other5RadiographyDate"];
                        updates["/"+child.key+"/findings"] = agent["other5RadiographyFindings"];
                        console.log(updates);
                        firebase.database().ref(refPathDestination).update(updates);
                      }
                      if (agent["other6Radiography"]){
                        updates["/"+child.key+"/typeSelected"] = "Otro";
                        updates["/"+child.key+"/typeSelectedDefine"] = agent["other6RadiographyType"];
                        updates["/"+child.key+"/patientKey"] = agent["patientKey"];
                        updates["/"+child.key+"/creationDate"] = agent["other6RadiographyDate"];
                        updates["/"+child.key+"/findings"] = agent["other6RadiographyFindings"];
                        console.log(agent["fullName"] + " radiography created" );                       firebase.database().ref(refPathDestination).update(updates);
                      }

                });
                console.log("collection updated");

                // res.json(snapshot.val());
                // userReference.off("value");
	});

});

//Bulk copy attribute to a new collection
app.post('/bulk_copy_densinometry', function (req, res) {
  
  var collection_origin = req.body.collection_origin;
  var collection_destination = req.body.collection_destination;

  var refPath = '/'+collection_origin+'/'
  var refPathDestination = '/'+collection_destination+'/'
  var userReference = firebase.database().ref(refPath);

  //Attach an asynchronous callback to read the data
  userReference.on("value",
        function(snapshot) {
                var updates = {}
                snapshot.forEach(function(child) {
                    var agent = child.val();
                    if (agent["boneDensinometry"]){

                      var creationDate = new Date();
                      if (agent["boneDensinometryDate"]){
                        creationDate = new Date(agent["boneDensinometryDate"]);
                      }
                      var miliseconds = creationDate.getTime();

                      updates["/"+child.key+"/captionDate"] = creationDate;
                      updates["/"+child.key+"/creationDate"] = creationDate;
                      updates["/"+child.key+"/creationDateMilliseconds"] = miliseconds;
                      updates["/"+child.key+"/findings"] = "Sin registrar";
                      updates["/"+child.key+"/lastModifiedDate"] = creationDate;
                      updates["/"+child.key+"/lastModifiedMilliseconds"] = miliseconds;
                      updates["/"+child.key+"/location"] = "Reumatología";
                      updates["/"+child.key+"/patientKey"] = agent["patientKey"];

                      console.log(agent["fullName"] + " " + creationDate);
                    }
                });
                firebase.database().ref(refPathDestination).update(updates);
                console.log(updates);
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

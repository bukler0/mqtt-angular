/**
 * Angular Test Application for mqtt-ionic
 * ---------------------------
 * Created by Bukler0
 */

/*
Create Angular Application
*/
var app = angular.module("testMQTT", ['mqtt']).run(function(){

	console.log("Angular application started");
});

/*
Test Controller 1
*/
app.controller('testController1', ['$scope', '$interval', 'mqtt', function($scope, $interval, mqtt){

	var options = {
            clientId: "test",
            protocolId: 'MQTT',
            protocolVersion: 4
        };
	mqtt.connect('ws://test.mosquitto.org:8080', options);
	
	mqtt.on("connect")
		.then(function() {
				mqtt.subscribe('presence');
		});

	var i = 0;
	$interval(function() {
		mqtt.publish('presence', i.toString());
		i++;
	}, 300);

	mqtt.on("message")
		.then( function(topic,message) { 
				console.log("message received (Controller 1)");
				console.log(topic+':'+message);
		});

}]);

/*
Test Controller 2
*/
app.controller('testController2', ['$scope', '$interval', 'mqtt', function($scope, $interval, mqtt){

	mqtt.on("connect")
		.then(function() {
				mqtt.subscribe('presence');
		});

	mqtt.on("message")
		.then( function(topic,message) { 
				console.log("message received (Controller 2)");
				console.log(topic+':'+message);
		});
}]);
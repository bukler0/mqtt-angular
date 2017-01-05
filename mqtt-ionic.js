(function (angular, require) {
  'use strict';
 
	var mqttClient  = function ($q, args) {
		debugger;
		this.aClient = null;
		this.$q = $q;
	};

	var mqtt = require('mqtt');


	mqttClient.prototype.connected = function () {
		if (this.aClient) {
			return this.aClient.connected;
		}
		else return false;
	}

	mqttClient.prototype.reconnecting = function() {
		if (this.aClient) {
			return this.aClient.reconnecting;
		}
		else return false;
	}
	/**
	 * 
	 * Returns a promise that will be resolved on the event fire
	 * @param  {String} event       one of the following (connect, reconnect, close, offline, error, message, packetsend, packetreceive)
	 * @return {promise}       [description]
	 */
	mqttClient.prototype.on = function(event) {

		var observer = function(event, client) {

			this._event = event;
			this._notifyFn = null;
			this._errorFn = null;
			this.observerCallback = {
				"connect"        : this.connectCallback,
				"reconnect"      : this.reconnectCallback,
				"close"          : this.closeCallback,
				"offline"        : this.offlineCallback,
				"error"          : this.errorCallback,
				"message"        : this.messageCallback,
				"packetsend"     : this.packetsendCallback,
				"packetreceive"  : this.packetreceiveCallback
			};		
			this.aClient = client;
		};

		observer.prototype.then = function(notifyFn, errorFn) {
			this._notifyFn = notifyFn;
			this._errorFn  = errorFn;

			if (this.observerCallback[this._event] ) 
				if (this.aClient) 
					this.aClient.on(this._event,this.observerCallback[this._event]);
				else this.errorFn('Not initialized');
			else this.errorFn('Invalid event');

		};

		/**
		 * Emitted on successful (re)connection
		 * @param  {[type]} connAck When clean connection option is false and server has a previous session for clientId connection option, then connack.sessionPresent flag is true. When that is the case, you may rely on stored session and prefer not to send subscribe commands for the client.
		 */
		observer.prototype.connectCallback = function(connAck) {
			this._notifyFn(connAck);
		};      
		/**
		 * Emitted when a reconnect starts.
		 */
		observer.prototype.reconnectCallback = function() {
			this._notifyFn();
		};
		/**
		 * Emitted after a disconnection.
		 */
		observer.prototype.closeCallback = function() {
			this._notifyFn();
		};
		/**
		 * Emitted when the client goes offline.
		 */
		observer.prototype.offlineCallback = function() {
			this._notifyFn();
		};
		/**
		 * Emitted when the client cannot connect (i.e. connack rc != 0) or when a parsing error occurs.
		 */
		observer.prototype.errorCallback = function(error) {
			this._notifyFn(error);
		};	

		observer.prototype.messageCallback = function (topic, message, packet) {
			this._notifyFn(topic,message,packet);
		};

		observer.prototype.packetsendCallback = function (packet) {
			this._notifyFn(packet);
		};

		observer.prototype.packetreceiveCallback = function (packet) {
			this._notifyFn(packet);
		};


        return new observer(event, this.aClient);
	};

	mqttClient.prototype.connect = function(brokerUrl,opts ) {
		this.aClient = mqtt.connect(brokerUrl,opts);	
	};

	/**
	 * 
	 * @param  {String | Array | Object} topics  
	 *                 	representes a string whith the topic, a list of strings with topics to subscribe or 
	 *   				  a object { topic1:qos, topic2:qos}
	 * @param  {Object} options                                     Object with subscription options, including qos
	 * @return {promise}                                            a Promise with subscrition result
	 *                                                                 resolve(granted) where granted is an array of {topic,qos}
	 *                                                                 where topic is s suscribed topic and qos is the granted qos
	 *                                                                 reject(error,granted) where error is the error 
	 */
	mqttClient.prototype.subscribe = function(topics, options) {

        var q = this.$q.defer();

		var callback = function(err, granted) {
			if (err) 
				q.reject(err, granted);
			else 
				q.resolve(granted);
		};        

        this.aClient.subscribe(topics, options, callback);

        return q.promise;
	};

	/**
	 * @param  {String | Array } topicOrArrayOfTopics  
	 *                 	 											representes a string whith the topic OR 
	 *                 	 						     				a list of strings with topics to subscribe
	 * @return {promise}                                            a Promise with unsubscrition result
	 *                                                                 resolve() 
	 *                                                                 reject(error) where error is the failure reason
	 */
	mqttClient.prototype.unsubscribe = function(topics) {
        var q = this.$q.defer();

		var callback = function(err) {
			if (err) 
				q.reject(err);
			else 
				q.resolve();
		};        

        this.aClient.unsubscribe(topics, callback);

        return q.promise;
	};

	mqttClient.prototype.end = function(force) {
		var q = this.$q.defer();

		var callback = function() {
			q.resolve();
		};        

        this.aClient.end(force, callback);

        return q.promise;
	};

	/**
	 * Publish a message to a topic
	 * topic is the topic to publish to, String
	 *     message is the message to publish, Buffer or String
	 *         options is the options to publish with, including:
     *      			qos QoS level, Number, default 0
     *         			retain retain flag, Boolean, default false
     *    callback - function (err), fired when the QoS handling completes, or at the next tick if QoS 0. An error occurs if client is disconnecting.

	 * @param  {[type]} topics  [description]
	 * @param  {[type]} message [description]
	 * @param  {[type]} options [description]
	 * @return {[type]}         [description]
	 */
	mqttClient.prototype.publish = function(topics, message,options) {
		var q = this.$q.defer();

		var callback = function(err, granted) {
			if (err) {
				q.reject(err, granted);
			}
			else {
				q.resolve(granted);
			}
		};        

        this.aClient.publish(topics, message, options, callback);

        return q.promise;
	};

  var mqttModule   = angular.module('mqtt',[]);
  var mqttProvider = function() {
  	this.args   = {};

  };

  mqttProvider.prototype.$get = [ '$q', function ($q) { return new mqttClient($q,this.args); }];

  mqttProvider.prototype.setConnection = function (brokerUrl,opts) {
  	if (arguments)
  		args.connection     = arguments;
  };

  mqttProvider.prototype.setDefaultPublishOptions = function() {
  	/**
  	 * options is the options to publish with, including:
	 *		    qos QoS level, Number, default 0
	 *		    retain retain flag, Boolean, default false
 	 */
 	  if (arguments)
  		args.defaultPublishOptions = arguments;
  };

   mqttProvider.prototype.setDefaultSubscribeOptions = function() {
  	/**
  	 * options is the options to publish with, including:
	 *		    qos QoS level, Number, default 0
 	 */
 	  if (arguments)
  		args.defaultSubscribeOptions = arguments;
   };

   mqttProvider.prototype.setAutoSubscriptionOptions = function() {
  	/**
  	 * options is the options to publish with, including:
	 *		    qos QoS level, Number, default 0
	 *		    topics is a topic list or object with {topicName:qos, topicName:qos2}
	 *      	subscribeOnConnectIfSessionPresent, if connection.options.clean = false and connAck.sessionPresent = true
 	 */
 	  if (arguments)
  		args.defaultSubscribeOptions = arguments;
   };   

  mqttModule.provider('mqtt',[ mqttProvider]);

})(angular, require);
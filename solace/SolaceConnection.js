class SolaceConnection {

  constructor(
    solace,
    host,
    vpn,
    user,
    pass) {

    this.host = host;
    this.vpn = vpn;
    this.user = user;
    this.password = pass;
    this.solace = solace;
    this.session = null;
    this.subscribed = false;
    this.queuesStarted = {};
  }

  log(line) {
    console.log(`SOLACE: ${line}`);
  }

  connect() {
    if (this.session !== null) {
      this.log('Already connected and ready to subscribe.');
      return;
    }
    
    try {
      this.session = this.solace.SolclientFactory.createSession({
        url: this.host,
        vpnName: this.vpn,
        userName: this.user,
        password: this.password,
      });
    } catch (error) {
      this.log(error.toString());
    }

    this.session.on(this.solace.SessionEventCode.UP_NOTICE, (sessionEvent) => {
      this.log('MQTT server has connected with success.');
    });

    this.session.on(this.solace.SessionEventCode.CONNECT_FAILED_ERROR, (sessionEvent) => {
      this.log(`connection failed to the message router: ${sessionEvent.infoStr} - check correct parameter values and connectivity!`);
      setTimeout(this.connect, 5000);
    });

    try {
      this.session.connect();
    } catch (error) {
      this.log(error.toString());
    }
  }

  startQueueConsumer(queueName, messageHandlerPromise) {
    if(this.session === null)
      this.connect();
    
    if (this.queuesStarted[queueName]) {
      this.log(`Already started consumer for queue "${queueName}" and ready to receive messages.`);
    } else {
      this.log(`Starting consumer for queue: ${queueName} !`);

      try {
        const messageConsumer = this.session.createMessageConsumer({
          queueDescriptor: { name: queueName, type: this.solace.QueueType.QUEUE },
          acknowledgeMode: this.solace.MessageConsumerAcknowledgeMode.CLIENT,
        });

        messageConsumer.on(this.solace.MessageConsumerEventName.UP, () => {
          this.log(`App reading data from solace queue '${queueName}'.`);
        });

        messageConsumer.on(this.solace.MessageConsumerEventName.CONNECT_FAILED_ERROR, () => {
          this.log(`App could not connect to queue ${queueName}. Be sure this queue exists on the message router vpn`);
          delete this.queuesStarted[queueName];
          setTimeout(() => this.startQueueConsumer(queueName, messageHandlerPromise), 5000);
        });
  
        messageConsumer.on(this.solace.MessageConsumerEventName.DOWN, () => {
          delete this.queuesStarted[queueName];
          this.log(`=== The message consumer of ${queueName} is now down ===`);
          setTimeout(() => this.startQueueConsumer(queueName, messageHandlerPromise), 5000);
        });

        messageConsumer.on(this.solace.MessageConsumerEventName.DOWN_ERROR, () => {
          delete this.queuesStarted[queueName];
          this.log(`=== An error happened, the message consumer of ${queueName} is down ===`);
          setTimeout(() => this.startQueueConsumer(queueName, messageHandlerPromise), 5000);
        });

        // I tried a work around to control messages flow
        // with stop() and start() before and after message consumer handler.
        messageConsumer.on(this.solace.MessageConsumerEventName.MESSAGE, (msg) => {
          // messageConsumer.stop(); // workarround
          messageHandlerPromise(msg)
            // .finally(() => messageConsumer.start()) // workarround
        });

        messageConsumer.connect();

        this.queuesStarted[queueName] = {
          messageConsumer: messageConsumer,
          handler: messageHandlerPromise
        };

      } catch (error) {
        this.log(error.toString());
      }
    }
  }
}

module.exports = SolaceConnection;
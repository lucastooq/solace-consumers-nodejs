require('dotenv').config();

const consumer = require('./controller/consumer');

const express = require('express');
const app = express();

const {solaceConnection} = require('./solace');

const healthRouter = require('./routes/health.js');

app.use('/health', healthRouter);

app.listen(8080, () => {
  solaceConnection.startQueueConsumer(process.env.BROKER_QUEUE_NAME, consumer.handlerSubscription);
  console.log('Service running on port 8080', new Date());
});

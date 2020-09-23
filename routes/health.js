const HealthRouter = require('express').Router();

HealthRouter.get('/', (req, res) => {
  res.send({ data: 'All good' });
});

module.exports = HealthRouter;
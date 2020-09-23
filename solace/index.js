const solace = require('solclientjs');
const SolaceConnection = require('./SolaceConnection');

const factoryProps = new solace.SolclientFactoryProperties();
factoryProps['profile'] = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);
solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);

const solaceConnection = new SolaceConnection(
  solace,
  process.env.BROKER_HOST,
  process.env.BROKER_VPN,
  process.env.BROKER_USER,
  process.env.BROKER_PASS
);

module.exports = {
  solaceConnection
}
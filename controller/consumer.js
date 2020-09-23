
const handlerSubscription = async (msg) => {
  let message = null;

  if(msg.isAcknowledged) {
    return;
  }

  try {
    message = JSON.parse(msg.getBinaryAttachment());
  } catch(e) {
    msg.acknowledge();
    return;
  }
  
  console.log('message is coming');

  // original code do insert on more than one tables
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      msg.acknowledge();
      resolve();
    }, 3000);
  });
}

module.exports = {
  handlerSubscription: handlerSubscription
};

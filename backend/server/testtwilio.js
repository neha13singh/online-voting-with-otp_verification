const twilio = require('twilio');

const accountSid = 'ACcd56c00ad5ce63d2abc0e5396a9ad735'; // Your Account SID
const authToken = 'f10bf16fc8f37f6c91debe88d196819c'; // Your Auth Token
const client = twilio(accountSid, authToken);

// Test sending a message
client.messages
    .create({
        body: 'Hello from Twilio!',
        from: '+919463634652', // Your Twilio number in E.164 format
        to: '+917379613013' // Replace with a valid Indian recipient number in E.164 format
    })
    .then(message => console.log('Message sent with SID:', message.sid))
    .catch(err => console.error('Error sending message:', err));

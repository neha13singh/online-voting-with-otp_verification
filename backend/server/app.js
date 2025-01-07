const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const twilio = require('twilio');
const cors = require('cors');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../../frontend')));
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Add this line to parse JSON requests

// MySQL connection
const connection = mysql.createConnection({
    host:'sql12.freesqldatabase.com',
    user:'sql12756344',
    database:'sql12756344',
    password:'j71r2XBpV6',
    port: 3306,
  });
  

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

// Twilio configuration
const accountSid = 'ACcd56c00ad5ce63d2abc0e5396a9ad735';
const authToken = 'f10bf16fc8f37f6c91debe88d196819c';
const client = twilio(accountSid, authToken);

// Route to send OTP
app.post('/send-otp', (req, res) => {
    const { phone_number } = req.body;

    if (!phone_number) {
        return res.status(400).send('Phone number is required');
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    client.messages
        .create({
            body: `Your OTP is ${otp}`,
            from: '9463634652', // Replace with your Twilio number
            to: phone_number
        })
        .then(message => {
            console.log('OTP sent:', message.sid);
            res.send('OTP sent successfully');
        })
        .catch(err => {
            console.error('Error sending OTP:', err);
            res.status(500).send('Error sending OTP');
        });
});

// Register user
app.post('/register', (req, res) => {
  const { username, phone_number, password, otp } = req.body;

  // Verify OTP here (this is a placeholder, implement your OTP verification logic)
  if (otp !== 'expected_otp') {
    return res.status(400).send('Invalid OTP');
  }

  const query = 'INSERT INTO users (username, phone_number, password) VALUES (?, ?, ?)';
connection.query(query, [username, phone_number, password], (err, result) => {
    if (err) {
      console.error('Error registering user:', err);
      return res.status(500).send('Error registering user');
    }
    res.send('User registered successfully');
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/views/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/views/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/views/register.html'));
});

app.get('/vote', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/views/vote.html'));
});

// Add more routes for handling form submissions and voting logic

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
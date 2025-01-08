const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const twilio = require('twilio');
const cors = require('cors');
const fetch = require('node-fetch');
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

    const otp = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP

    // Log the OTP for debugging (remove in production)
    console.log(`Generated OTP for ${phone_number}: ${otp}`);

    client.messages
        .create({
            body: `Your OTP is ${otp}`,
            from: '+919463634652', // Replace with your Twilio number in E.164 format
            to: phone_number // Ensure this is in E.164 format as well
        })
        .then(message => {
            console.log('OTP sent:', message.sid); // Log the message SID
            res.send('OTP sent successfully');
        })
        .catch(err => {
            console.error('Error sending OTP:', err); // Log the error
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

// Add this new route to verify phone.email
app.post('/verify-phone-email', async (req, res) => {
    const { user_json_url } = req.body;
    
    try {
        // Fetch user data from phone.email
        const response = await fetch(user_json_url);
        const userData = await response.json();
        
        const phone_number = `${userData.user_country_code}${userData.user_phone_number}`;
        
        res.json({
            success: true,
            phone_number,
            first_name: userData.user_first_name,
            last_name: userData.user_last_name
        });
    } catch (error) {
        console.error('Error verifying phone.email:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify phone number'
        });
    }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
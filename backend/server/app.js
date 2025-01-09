const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const twilio = require('twilio');
const cors = require('cors');
const fetch = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args));
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

// Function to encode the phone number in base 64
const encodePhoneNumber = (phone_number) => {
    return Buffer.from(phone_number).toString('base64');
};

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
    const { username, phone_number, password, first_name, last_name, age } = req.body;

    const query = 'INSERT INTO users (username, phone_number, password, first_name, last_name, age) VALUES (?, ?, ?, ?, ?, ?)';
    connection.query(query, [username, phone_number, password, first_name, last_name, age], (err, result) => {
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

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  connection.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }

    // Simplify the user data we're sending back
    const userData = {
      id: results[0].id,
      username: results[0].username,
      has_voted: results[0].has_voted,
      isLoggedIn: true,
      age: results[0].age
    };

    res.json({ 
      success: true, 
      message: 'Login successful',
      user: userData
    });
  });
});



app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/views/register.html'));
});



app.get('/candidates', (req, res) => {
    const query = `
        SELECT c.*, COUNT(v.id) as vote_count 
        FROM candidates c
        LEFT JOIN votes v ON c.id = v.candidate_id
        GROUP BY c.id
    `;
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching candidates:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
        res.json({ success: true, candidates: results });
    });
});

// give a vote to a candidate
app.post('/vote', (req, res) => {
    const { candidate_id, user_id } = req.body;
    
    // First update the user's has_voted status
    const updateUserQuery = 'UPDATE users SET has_voted = TRUE WHERE id = ?';
    connection.query(updateUserQuery, [user_id], (err, userResult) => {
        if (err) {
            console.error('Error updating user vote status:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }

        // Then insert the vote record
        const voteQuery = 'INSERT INTO votes (candidate_id, user_id) VALUES (?, ?)';
        connection.query(voteQuery, [candidate_id, user_id], (err, voteResult) => {
            if (err) {
                console.error('Error voting:', err);
                return res.status(500).json({ success: false, error: 'Internal server error' });
            }
            res.json({ success: true, message: 'Vote submitted successfully' });
        });
    });
});

// get the per candidate votes count
app.get('/votes/:candidate_id', (req, res) => {
    const { candidate_id } = req.params;
    const query = 'SELECT COUNT(*) AS vote_count FROM votes WHERE candidate_id = ?';
    connection.query(query, [candidate_id], (err, result) => {
        if (err) {
            console.error('Error fetching votes:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
        res.json({ success: true, vote_count: result[0].vote_count });
    });
});

// Get voters for a candidate
app.get('/voters/:candidateId', (req, res) => {
    const { candidateId } = req.params;
    const query = `
        SELECT u.first_name, u.last_name 
        FROM votes v
        JOIN users u ON v.user_id = u.id
        WHERE v.candidate_id = ?
    `;
    connection.query(query, [candidateId], (err, results) => {
        if (err) {
            console.error('Error fetching voters:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
        const voters = results.map(voter => ({
            name: `${voter.first_name} ${voter.last_name}`
        }));
        res.json({ success: true, voters });
    });
});

// admin login api
app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM admin WHERE username = ? AND password = ?';
    connection.query(query, [username, password], (err, result) => {
        if (err) {
            console.error('Admin login error:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
        res.json({ success: true, message: 'Admin login successful' });
    });
});

// candidate register api 
app.post('/candidate-register', (req, res) => {
    const { name, image} = req.body;
    const query = 'INSERT INTO candidates (name, image) VALUES (?, ?)';
    connection.query(query, [name, image], (err, result) => {
        if (err) {
            console.error('Error registering candidate:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
        res.json({ success: true, message: 'Candidate registered successfully' });
    });
});

// reset candidate votes
app.post('/reset-candidate-votes', (req, res) => {
    // First reset the has_voted flag for all users
    const resetUsersQuery = 'UPDATE users SET has_voted = FALSE';
    connection.query(resetUsersQuery, (err, result) => {
        if (err) {
            console.error('Error resetting user voted status:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
        
        // Then delete all votes
        const deleteVotesQuery = 'DELETE FROM votes';
        connection.query(deleteVotesQuery, (err, result) => {
            if (err) {
                console.error('Error resetting candidate votes:', err);
                return res.status(500).json({ success: false, error: 'Internal server error' });
            }
            res.json({ success: true, message: 'Votes reset successfully' });
        });
    });
});


// candidate delete api
app.post('/candidate-delete', (req, res) => {
    const { id } = req.body;

    // First get all users who voted for this candidate
    const findVotersQuery = 'SELECT user_id FROM votes WHERE candidate_id = ?';
    connection.query(findVotersQuery, [id], (err, voters) => {
        if (err) {
            console.error('Error finding voters:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }

        // Get array of user IDs who voted for this candidate
        const userIds = voters.map(voter => voter.user_id);

        if (userIds.length > 0) {
            // Reset has_voted flag for these users
            const resetVotersQuery = 'UPDATE users SET has_voted = FALSE WHERE id IN (?)';
            connection.query(resetVotersQuery, [userIds], (err, result) => {
                if (err) {
                    console.error('Error resetting voter status:', err);
                    return res.status(500).json({ success: false, error: 'Internal server error' });
                }

                // Delete the candidate and related votes
                const deleteVotesQuery = 'DELETE FROM votes WHERE candidate_id = ?';
                connection.query(deleteVotesQuery, [id], (err, result) => {
                    if (err) {
                        console.error('Error deleting votes:', err);
                        return res.status(500).json({ success: false, error: 'Internal server error' });
                    }

                    const deleteCandidateQuery = 'DELETE FROM candidates WHERE id = ?';
                    connection.query(deleteCandidateQuery, [id], (err, result) => {
                        if (err) {
                            console.error('Error deleting candidate:', err);
                            return res.status(500).json({ success: false, error: 'Internal server error' });
                        }
                        res.json({ success: true, message: 'Candidate and related votes deleted successfully' });
                    });
                });
            });
        } else {
            // If no votes exist, just delete the candidate
            const deleteCandidateQuery = 'DELETE FROM candidates WHERE id = ?';
            connection.query(deleteCandidateQuery, [id], (err, result) => {
                if (err) {
                    console.error('Error deleting candidate:', err);
                    return res.status(500).json({ success: false, error: 'Internal server error' });
                }
                res.json({ success: true, message: 'Candidate deleted successfully' });
            });
        }
    });
});

// delete all candidates and reset all users' has_voted status
app.post('/delete-all-candidates', (req, res) => {
    // First reset all users' has_voted status
    const resetVotersQuery = 'UPDATE users SET has_voted = FALSE';
    connection.query(resetVotersQuery, (err, result) => {
        if (err) {
            console.error('Error resetting voter status:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }

        // Then delete all candidates
        const deleteCandidatesQuery = 'DELETE FROM candidates';
        connection.query(deleteCandidatesQuery, (err, result) => {
            if (err) {
                console.error('Error deleting all candidates:', err);
                return res.status(500).json({ success: false, error: 'Internal server error' });
            }
            res.json({ success: true, message: 'All candidates deleted and voter status reset successfully' });
        });
    });
});


// Add more routes for handling form submissions and voting logic

// Add this new route to verify phone.email and check for existing users
app.post('/verify-phone-email', async (req, res) => {
    const { user_json_url } = req.body;
    
    try {
        const response = await fetch(user_json_url);
        const userData = await response.json();
        const phone_number = `${userData.user_country_code}${userData.user_phone_number}`;
        
        connection.query(
            'SELECT * FROM users WHERE phone_number = ?',
            [phone_number],
            (err, results) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        error: 'Database error'
                    });
                }

                const encodedPhoneNumber = encodePhoneNumber(phone_number);

                res.json({
                    success: true,
                    isExistingUser: results.length > 0,
                    phone_number: encodedPhoneNumber
                });
            }
        );
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to verify phone number'
        });
    }
});

// Add new route for phone-login page
app.get('/phone-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/views/phone-login.html'));
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
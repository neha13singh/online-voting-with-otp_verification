const mysql = require("mysql2");

const connection = mysql.createConnection({
  host:'sql12.freesqldatabase.com',
  user:'sql12756344',
  database:'sql12756344',
  password:'j71r2XBpV6',
  port: 3306,
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

// Function to create users table
const createUsersTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      phone_number VARCHAR(15) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      has_voted BOOLEAN DEFAULT FALSE
    )
  `;
  connection.query(query, (err, result) => {
    if (err) {
      console.error('Error creating users table:', err);
      return;
    }
    console.log('Users table created or already exists');
  });
};

// Function to create votes table
const createVotesTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS votes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_id INT,
      user_id INT,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `;
  connection.query(query, (err, result) => {
    if (err) {
      console.error('Error creating votes table:', err);
      return;
    }
    console.log('Votes table created or already exists');
  });
};

const createCandidatesTable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS candidates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    )
  `;
  connection.query(query, (err, result) => {
    if (err) {
      console.error('Error creating candidates table:', err);
      return;
    }
    console.log('Candidates table created or already exists');
  });
};

// Function to run all setup queries
const runSetup = () => {
  createUsersTable();
  createVotesTable();
  createCandidatesTable();
};

// Run the setup
runSetup();

// Close the database connection
connection.end((err) => {
  if (err) {
    console.error('Error closing the database connection:', err);
    return;
  }
  console.log('Database connection closed');
});
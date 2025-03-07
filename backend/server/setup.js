const mysql = require('mysql2');
require('dotenv').config();
const connection = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
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
  // First drop the existing table
  connection.query('DROP TABLE IF EXISTS users', (err, result) => {
    if (err) {
      console.error('Error dropping users table:', err);
      return;
    }
    console.log('Existing users table dropped');

    // Then create the new table
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        phone_number VARCHAR(15) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        has_voted BOOLEAN DEFAULT FALSE,
        age INT NOT NULL
      )`;
    connection.query(query, (err, result) => {
      if (err) {
        console.error('Error creating users table:', err);
        return;
      }
      console.log('Users table created successfully');
    });
  });
};

const createAdminDatatable = () => {
  const query = `
    CREATE TABLE IF NOT EXISTS admin (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL
    )`;
  connection.query(query, (err, result) => {
    if (err) {
      console.error('Error creating admin table:', err);
      return;
    }
    console.log('Admin table created or already exists');
  });
};

// Function to create votes table
const createVotesTable = () => {
  // First drop the existing table
  connection.query('DROP TABLE IF EXISTS votes', (err, result) => {
    if (err) {
      console.error('Error dropping votes table:', err);
      return;
    }
    console.log('Existing votes table dropped');

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
  });
};

const createCandidatesTable = () => {
  // First drop the existing table
  connection.query('DROP TABLE IF EXISTS candidates', (err, result) => {
    if (err) {
      console.error('Error dropping candidates table:', err);
      return;
    }
    console.log('Existing candidates table dropped');

    const query = `
      CREATE TABLE IF NOT EXISTS candidates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        image VARCHAR(255) NOT NULL
      )`;
    connection.query(query, (err, result) => {
      if (err) {
        console.error('Error creating candidates table:', err);
        return;
      }
      console.log('Candidates table created or already exists');
    });
  });
};

// Function to run all setup queries
const runSetup = async () => {
  try {
    // First drop tables with foreign keys
    await new Promise((resolve, reject) => {
      connection.query('DROP TABLE IF EXISTS votes', (err, result) => {
        if (err) {
          console.error('Error dropping votes table:', err);
          reject(err);
          return;
        }
        console.log('Existing votes table dropped');
        resolve();
      });
    });

    // Then drop and create tables without foreign keys
    await new Promise((resolve, reject) => {
      connection.query('DROP TABLE IF EXISTS users', (err, result) => {
        if (err) {
          console.error('Error dropping users table:', err);
          reject(err);
          return;
        }
        console.log('Existing users table dropped');
        resolve();
      });
    });

    await new Promise((resolve, reject) => {
      connection.query('DROP TABLE IF EXISTS candidates', (err, result) => {
        if (err) {
          console.error('Error dropping candidates table:', err);
          reject(err);
          return;
        }
        console.log('Existing candidates table dropped');
        resolve();
      });
    });

    await new Promise((resolve, reject) => {
      connection.query('DROP TABLE IF EXISTS admin', (err, result) => {
        if (err) {
          console.error('Error dropping admin table:', err);
          reject(err);
          return;
        }
        console.log('Existing admin table dropped');
        resolve();
      });
    });

    // Now create tables in correct order
    createAdminDatatable();
    createCandidatesTable();
    createUsersTable();
    createVotesTable();
  } catch (error) {
    console.error('Error during setup:', error);
  }
};

// Run the setup and close connection after completion
runSetup().then(() => {
  setTimeout(() => {
    connection.end((err) => {
      if (err) {
        console.error('Error closing the database connection:', err);
        return;
      }
      console.log('Database connection closed');
    });
  }, 2000); // Wait 2 seconds before closing to ensure all operations complete
});

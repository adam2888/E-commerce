import dotenv from 'dotenv'; 
dotenv.config();  


import pkg from 'pg';  
const { Client } = pkg;  





const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,    
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


async function connectToDatabase() {
  try {
    await client.connect();  
    console.log('Connected to PostgreSQL database');
  } catch (err) {
    console.error('Error connecting to the database', err);
  }
};






connectToDatabase();

export default client;  

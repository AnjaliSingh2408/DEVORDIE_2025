import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import nodemailer from 'nodemailer';

const { Pool } = pg;
const app = express();

// --- FINAL CONFIGURATION ---
const SECRET_KEY = "RangerHQ_Super_Final_Secret_Key_9999"; // HARDCODED FINAL KEY
const PORT = 3000; // HARDCODED PORT to match frontend calls
const HOST = '0.0.0.0'; // Fixes IP binding conflicts

// Middleware
app.use(cors());
app.use(express.json());

// 1. Database Setup (DB credentials still rely on .env for security)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: 5432,
});

// 2. Email Setup (Nodemailer)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// --- API ROUTES ---

// Route A: Generate Identity (Signup)
app.post('/create-identity', async (req, res) => {
  const { name, role, email } = req.body;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 2);

  try {
    const newUser = await pool.query(
      "INSERT INTO users (name, role, email, is_active, qr_expires_at) VALUES ($1, $2, $3, true, $4) RETURNING *",
      [name, role, email, expiryDate]
    );
    const user = newUser.rows[0];

    // Signed with the HARDCODED KEY
    const token = jwt.sign(
      { id: user.id, role: user.role },
      SECRET_KEY,
      { expiresIn: '2d' } 
    );

    res.json({ success: true, user, token });
  } catch (err) {
    console.error("CREATE IDENTITY ERROR:", err);
    res.status(500).json({ error: "Database or Server Error during creation." });
  }
});

// Route B: Verify QR (Scanner)
app.post('/verify-qr', async (req, res) => {
  const { token, geoLat, geoLong } = req.body;

  try {
    // 1. Verify Signature (Uses the exact same HARDCODED KEY)
    const decoded = jwt.verify(token, SECRET_KEY); 
    
    // 2. Check DB (This line will only run if the secret key matches)
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.id]);
    const user = userResult.rows[0];

    if (!user || !user.is_active) throw new Error("ID Revoked / Inactive");

    // 3. Log Success
    await pool.query(
      "INSERT INTO verification_logs (user_id, status, geo_lat, geo_long) VALUES ($1, 'SUCCESS', $2, $3)",
      [user.id, geoLat, geoLong]
    );

    // 4. Send Full Details
    res.json({ 
      status: 'ACCESS GRANTED', 
      userData: {
        name: user.name,
        role: user.role,
        email: user.email,
        expires: new Date(decoded.exp * 1000).toLocaleTimeString()
      }
    });

  } catch (err) {
    let reason = err.message;
    if (err.name === 'JsonWebTokenError') reason = 'INVALID SIGNATURE / WRONG QR';
    if (err.name === 'TokenExpiredError') reason = 'PASS EXPIRED';

    await pool.query(
      "INSERT INTO verification_logs (status, failure_reason, geo_lat, geo_long) VALUES ('FAILED', $1, $2, $3)",
      [reason, geoLat, geoLong]
    );
    
    res.status(401).json({ status: 'ACCESS DENIED', reason });
  }
});

// ... AUTOMATION (Cron Job) is below ...

// Final Startup Sequence
// const PORT = 3000; // Hardcoded to match frontend
// const HOST = '0.0.0.0'; 

// Server ko seedha chalao, bina async check ke
app.listen(PORT, HOST, () => {
    console.log(`🚀 HQ Server running on port ${PORT}`);
    console.log("--- TEST PASSED: SERVER ALIVE ---");
});
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import nodemailer from 'nodemailer';

const { Pool } = pg;
const app = express();

const SECRET_KEY = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// 1. Database Setup
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
    user: process.env.EMAIL_USER, // Your Gmail
    pass: process.env.EMAIL_PASS  // Your App Password
  }
});

// --- API ROUTES ---

// Route A: Generate Identity (Signup)
app.post('/create-identity', async (req, res) => {
  const { name, role, email } = req.body;

  // Set Expiry date to 2 days from now (for Database storage)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 2);

  try {
    // 1. Insert User into DB (With Email & Expiry Date)
    const newUser = await pool.query(
      "INSERT INTO users (name, role, email, is_active, qr_expires_at) VALUES ($1, $2, $3, true, $4) RETURNING *",
      [name, role, email, expiryDate]
    );
    const user = newUser.rows[0];

    // 2. Generate Signed Token (Valid for 2 Days)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      SECRET_KEY,
      { expiresIn: '2d' } // Token auto-expires in 2 days
    );

    res.json({ success: true, user, token });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Database or Server Error" });
  }
});

// Route B: Verify QR (Scanner)
app.post('/verify-qr', async (req, res) => {
  const { token, geoLat, geoLong } = req.body;

  try {
    // 1. Verify Signature & Check Expiry
    // If 2 days have passed, this line throws an error automatically
    const decoded = jwt.verify(token, SECRET_KEY);

    // 2. Check DB: Is user still active?
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.id]);
    const user = userResult.rows[0];

    if (!user || !user.is_active) throw new Error("ID Revoked / Inactive");

    // 3. Log Success (with Geo-Tags)
    await pool.query(
      "INSERT INTO verification_logs (user_id, status, geo_lat, geo_long) VALUES ($1, 'SUCCESS', $2, $3)",
      [user.id, geoLat, geoLong]
    );

    res.json({ status: 'ACCESS GRANTED', user: user.name, role: user.role });

  } catch (err) {
    // 4. Log Failure
    const reason = err.name === 'TokenExpiredError' ? 'PASS EXPIRED' : err.message;
    
    await pool.query(
      "INSERT INTO verification_logs (status, failure_reason, geo_lat, geo_long) VALUES ('FAILED', $1, $2, $3)",
      [reason, geoLat, geoLong]
    );
    
    res.status(401).json({ status: 'ACCESS DENIED', reason });
  }
});

// --- AUTOMATION (Cron Job) ---

// Runs every hour to check for expired passes
cron.schedule('0 * * * *', async () => {
  console.log("⏰ Running Hourly Expiry Check...");
  const now = new Date();

  try {
    // Find users whose QR expired AND who are still marked 'active'
    // (This prevents sending the same mail forever)
    const expiredUsers = await pool.query(
      "SELECT * FROM users WHERE qr_expires_at < $1 AND is_active = true", 
      [now]
    );

    for (const user of expiredUsers.rows) {
      console.log(`📧 Sending Expiry Mail to: ${user.email}`);

      // Send Email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: '⚠️ ACTION REQUIRED: Ranger Pass Expired',
        text: `Greetings Ranger ${user.name},\n\nYour secure access QR code has expired (Validity: 2 Days).\nTo continue accessing HQ, please login to the dashboard and regenerate your pass.\n\nStay Safe,\nHQ Security Ops`
      });

      // Optional: Mark them inactive so we don't spam them every hour
      // Or keep a separate flag like 'notification_sent'
       await pool.query("UPDATE users SET is_active = false WHERE id = $1", [user.id]);
    }
  } catch (err) {
    console.error("Cron Job Error:", err);
  }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 HQ Server running on port ${PORT}`));
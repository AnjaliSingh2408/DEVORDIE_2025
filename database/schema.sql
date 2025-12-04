-- 1. Create the Users table (Identity Records)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,       -- e.g. 'Red Ranger'
    email VARCHAR(255),              -- Added for Notifications
    is_active BOOLEAN DEFAULT TRUE,  -- To revoke access manually
    qr_expires_at TIMESTAMP,         -- To track when the 2-day pass dies
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create the Logs table (Audit Trail)
CREATE TABLE verification_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id), -- Links back to the User
    status VARCHAR(50) NOT NULL,      -- 'SUCCESS' or 'FAILED'
    failure_reason TEXT,              -- e.g. 'PASS EXPIRED'
    geo_lat DECIMAL,                  -- Latitude from Scanner
    geo_long DECIMAL,                 -- Longitude from Scanner
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
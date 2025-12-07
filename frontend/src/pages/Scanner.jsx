import React, { useState, useEffect } from 'react';
import QrScanner from 'react-qr-scanner';
import axios from 'axios';

const Scanner = () => {
  const [status, setStatus] = useState('IDLE'); // IDLE, SCANNING, GRANTED, DENIED, TIMEOUT
  const [scanResult, setScanResult] = useState('');
  const [serverData, setServerData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 Minutes

  // Feature: Timeout Logic (Keep this)
  useEffect(() => {
    let timer;
    if (status === 'IDLE' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setStatus('TIMEOUT');
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const handleScan = (result, error) => {
    if (result && result?.text !== scanResult && status === 'IDLE') {
      setScanResult(result?.text);
      verifyPass(result?.text);
    }
  };
  const handleError = (error) => {
    // Yeh browser error ko terminal mein print karega
    console.error("New Scanner Component Error:", error);
};

  const verifyPass = (token) => {
    setStatus('SCANNING');
    
    // Geolocation Logic (Keep this)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => sendRequest(token, position.coords.latitude, position.coords.longitude),
        () => sendRequest(token, null, null)
      );
    } else {
      sendRequest(token, null, null);
    }
  };

  const sendRequest = async (token, lat, long) => {
    try {
      const res = await axios.post('http://localhost:3000/verify-qr', { token, geoLat: lat, geoLong: long });
      
      // Feature: Show User Details
      setServerData(res.data.userData); 
      setStatus('GRANTED');
      
    } catch (err) {
      // Feature: Wrong QR/Error Message Handling
      setErrorMsg(err.response?.data?.reason || "UNKNOWN ERROR");
      setStatus('DENIED');
    }
  };

  const resetScanner = () => {
    setStatus('IDLE');
    setScanResult('');
    setServerData(null);
    setErrorMsg('');
    setTimeLeft(120); // Reset timer
  };

  // --- RENDER UI ---

  // Timeout Screen UI
  if (status === 'TIMEOUT') {
    return (
      <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#f0f0f0', border: '2px solid #333' }}>
        <h1 style={{ color: 'gray', fontSize: '24px' }}>SCANNER SLEEPING (2 MIN TIMEOUT)</h1>
        <p style={{ marginBottom: '20px' }}>Camera turned off due to inactivity.</p>
        <button onClick={resetScanner} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
          WAKE UP SCANNER
        </button>
      </div>
    );
  }

  const statusColor = status === 'GRANTED' ? 'green' : status === 'DENIED' ? 'red' : 'gray';

  return (
    <div style={{ padding: '20px', textAlign: 'center', maxWidth: '500px', margin: '50px auto', border: `2px solid ${statusColor}` }}>
      <h2 style={{ color: statusColor, marginBottom: '20px' }}>GATE SECURITY CHECKPOINT</h2>
      
      {/* Timer Display */}
      {status === 'IDLE' && (
        <p style={{ fontSize: '12px', color: 'gray' }}>Auto-Off In: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
      )}

      {/* Scanner Box (Fixed size for reliable scanning) */}
      {(status === 'IDLE' || status === 'SCANNING') && (
        <div style={{ width: '300px', height: '300px', margin: '15px auto', border: '1px solid #333', overflow: 'hidden' }}>
            <QrScanner
                // Naye component mein onResult ki jagah onDecode use hota hai
                onDecode={handleScan} 
                onError={handleError}
                constraints={{ video: { facingMode: 'environment' } }}
                videoStyle={{ width: '100%', height: '100%' }}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
      )}

      {/* Status Output */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: statusColor, color: 'white', borderRadius: '5px' }}>
        {status === 'IDLE' && <p>Awaiting Identity Scan...</p>}
        {status === 'SCANNING' && <p>Authenticating...</p>}
        
        {/* GRANTED Status & Details Card */}
        {status === 'GRANTED' && serverData && (
          <div>
            <h3 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>✅ ACCESS GRANTED</h3>
            <div style={{ backgroundColor: 'white', color: '#333', padding: '15px', borderRadius: '5px', textAlign: 'left' }}>
              <p><strong>Name:</strong> {serverData.name}</p>
              <p><strong>Designation:</strong> {serverData.role}</p>
              <p><strong>Email:</strong> {serverData.email}</p>
              <p><strong>Token Expires:</strong> {serverData.expires}</p>
            </div>
            <button onClick={resetScanner} style={{ padding: '8px 15px', marginTop: '10px', backgroundColor: '#0056b3', color: 'white', border: 'none', cursor: 'pointer' }}>
              SCAN NEXT
            </button>
          </div>
        )}
        
        {/* DENIED Status & Error Message */}
        {status === 'DENIED' && (
          <div>
            <h3 style={{ fontSize: '24px', margin: '0 0 10px 0' }}>❌ ACCESS DENIED</h3>
            <p style={{ backgroundColor: 'white', color: 'red', padding: '10px', borderRadius: '5px', fontWeight: 'bold' }}>Reason: {errorMsg}</p>
            <button onClick={resetScanner} style={{ padding: '8px 15px', marginTop: '10px', backgroundColor: '#8b0000', color: 'white', border: 'none', cursor: 'pointer' }}>
              RETRY SCAN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import axios from 'axios';

const Scanner = () => {
  const [scanResult, setScanResult] = useState('');
  const [status, setStatus] = useState('IDLE'); // IDLE, GRANTED, DENIED, ERROR
  const [serverMsg, setServerMsg] = useState('');

  const handleScan = (result, error) => {
    if (result && result?.text !== scanResult) {
      setScanResult(result?.text);
      verifyPass(result?.text);
    }
  };

  const verifyPass = (token) => {
    setStatus('SCANNING');
    
    // Brownie Point: Capture Location before sending
    if (!navigator.geolocation) {
       // Fallback if browser doesn't support GPS
       sendVerificationRequest(token, null, null);
       return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        sendVerificationRequest(token, position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.warn("GPS access denied, sending without location.");
        sendVerificationRequest(token, null, null);
      }
    );
  };

  const sendVerificationRequest = async (token, lat, long) => {
    try {
      const res = await axios.post('http://localhost:3000/verify-qr', {
        token: token,
        geoLat: lat,
        geoLong: long
      });

      if (res.data.status === 'ACCESS GRANTED') {
        setStatus('GRANTED');
        setServerMsg(`Welcome, ${res.data.user} (${res.data.role})`);
      }
    } catch (err) {
      setStatus('DENIED');
      // Backend now sends specific reasons like "PASS EXPIRED"
      setServerMsg(err.response?.data?.reason || "Verification Failed");
    }
  };

  // UI Helper for Background Color
  const getBgColor = () => {
    if (status === 'GRANTED') return '#2ecc71'; // Green
    if (status === 'DENIED') return '#e74c3c'; // Red
    return '#ecf0f1'; // Grey (Idle)
  };

  return (
    <div style={{ ...styles.fullScreen, backgroundColor: getBgColor() }}>
      <div style={styles.scannerBox}>
        <h2 style={{marginBottom: '20px'}}>Security Checkpoint</h2>
        
        {status === 'IDLE' || status === 'SCANNING' ? (
          <div style={styles.cameraContainer}>
            <QrReader
              onResult={handleScan}
              constraints={{ facingMode: 'environment' }}
              style={{ width: '100%' }}
            />
            <div style={styles.overlay}>Align QR Code</div>
          </div>
        ) : (
          <div style={styles.resultContainer}>
            <h1 style={{fontSize: '40px', color: 'white'}}>
              {status === 'GRANTED' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
            </h1>
            <p style={{color: 'white', fontSize: '20px'}}>{serverMsg}</p>
            
            <button onClick={() => { setStatus('IDLE'); setScanResult(''); }} style={styles.resetBtn}>
              Scan Next Ranger
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  fullScreen: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial' },
  scannerBox: { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', textAlign: 'center', maxWidth: '400px', width: '90%' },
  cameraContainer: { position: 'relative', overflow: 'hidden', borderRadius: '10px' },
  overlay: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', border: '2px solid rgba(255,255,255,0.7)', padding: '50px', borderRadius: '10px', pointerEvents: 'none' },
  resetBtn: { marginTop: '20px', padding: '10px 20px', fontSize: '18px', border: 'none', borderRadius: '5px', cursor: 'pointer', background: 'white', color: '#333' }
};

export default Scanner;
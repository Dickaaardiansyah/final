// src/components/OTPVerification.jsx
import React, { useState, useEffect, useRef } from 'react';

function OTPVerification({ email, userName, onSuccess, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60); // Countdown untuk resend
  const [canResend, setCanResend] = useState(false);
  
  // Refs untuk input OTP
  const inputRefs = useRef([]);

  // API Base URL
  const API_BASE_URL = 'http://localhost:5000';

  // Timer countdown untuk resend OTP
  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Focus ke input pertama saat component mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index, value) => {
    // Hanya terima angka
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Clear error saat user mengetik
    if (error) setError('');

    // Auto-focus ke input berikutnya
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit jika semua field terisi
    if (index === 5 && value && newOtp.every(digit => digit !== '')) {
      setTimeout(() => handleVerifyOTP(newOtp.join('')), 100);
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: hapus current dan focus ke previous
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Enter: submit jika OTP lengkap
    if (e.key === 'Enter') {
      const otpCode = otp.join('');
      if (otpCode.length === 6) {
        handleVerifyOTP(otpCode);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, ''); // Hanya angka
    
    if (pasteData.length === 6) {
      const newOtp = pasteData.split('');
      setOtp(newOtp);
      
      // Focus ke input terakhir
      inputRefs.current[5]?.focus();
      
      // Auto-submit
      setTimeout(() => handleVerifyOTP(pasteData), 100);
    }
  };

  const handleVerifyOTP = async (otpCode = null) => {
    const codeToVerify = otpCode || otp.join('');
    
    if (codeToVerify.length !== 6) {
      setError('Kode OTP harus 6 digit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Verifying OTP:', { email, otp_code: codeToVerify });

      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp_code: codeToVerify,
        }),
      });

      const data = await response.json();
      console.log('OTP verification response:', data);

      if (response.ok && data.accessToken) {
        // Verifikasi berhasil
        console.log('OTP verification successful');
        onSuccess(data.user, data.accessToken);
        
      } else {
        throw new Error(data.msg || 'Verifikasi OTP gagal');
      }

    } catch (error) {
      console.error('OTP verification error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setError('Gagal terhubung ke server');
      } else {
        setError(error.message || 'Terjadi kesalahan saat verifikasi');
      }
      
      // Clear OTP dan focus ke input pertama
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');

    try {
      console.log('Resending OTP to:', email);

      const response = await fetch(`${API_BASE_URL}/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      const data = await response.json();
      console.log('Resend OTP response:', data);

      if (response.ok) {
        // Reset timer dan state
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        
        alert('Kode OTP baru telah dikirim ke email Anda');
        
        // Focus ke input pertama
        inputRefs.current[0]?.focus();
        
      } else {
        throw new Error(data.msg || 'Gagal mengirim ulang OTP');
      }

    } catch (error) {
      console.error('Resend OTP error:', error);
      setError(error.message || 'Gagal mengirim ulang kode OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="container">
        <div className="header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h1 className="title">Verifikasi Email</h1>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            animation: 'bounce 2s infinite'
          }}>
            📧
          </div>
          
          <p className="subtitle">
            Kami telah mengirim kode verifikasi ke:
          </p>
          <p style={{ 
            fontWeight: 'bold', 
            color: '#4a90e2', 
            fontSize: '16px',
            marginBottom: '8px'
          }}>
            {email}
          </p>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Masukkan 6 digit kode verifikasi di bawah ini
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            textAlign: 'center',
            fontSize: '14px'
          }}>
            <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}

        {/* OTP Input */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '30px'
        }}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={loading}
              style={{
                width: '50px',
                height: '60px',
                fontSize: '24px',
                fontWeight: 'bold',
                textAlign: 'center',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: loading ? '#f5f5f5' : 'white',
                color: '#333',
                transition: 'all 0.3s',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4a90e2';
                e.target.style.boxShadow = '0 0 0 3px rgba(74, 144, 226, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e0e0e0';
                e.target.style.boxShadow = 'none';
              }}
            />
          ))}
        </div>

        {/* Submit Button */}
        <button
          onClick={() => handleVerifyOTP()}
          disabled={otp.join('').length !== 6 || loading}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: otp.join('').length !== 6 || loading ? 'not-allowed' : 'pointer',
            opacity: otp.join('').length !== 6 || loading ? 0.6 : 1,
            transition: 'all 0.3s',
            marginBottom: '20px'
          }}
        >
          {loading ? (
            <>
              <span style={{ marginRight: '8px' }}>⏳</span>
              Memverifikasi...
            </>
          ) : (
            'Verifikasi Kode'
          )}
        </button>

        {/* Resend Section */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
            Tidak menerima kode?
          </p>
          
          {!canResend ? (
            <p style={{ color: '#666', fontSize: '14px' }}>
              Kirim ulang dalam {timer} detik
            </p>
          ) : (
            <button
              onClick={handleResendOTP}
              disabled={resendLoading}
              style={{
                background: 'none',
                border: 'none',
                color: '#4a90e2',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: resendLoading ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
                opacity: resendLoading ? 0.6 : 1
              }}
            >
              {resendLoading ? 'Mengirim...' : 'Kirim Ulang Kode'}
            </button>
          )}
        </div>

        {/* Tips */}
        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>💡 Tips:</strong>
          <ul style={{ margin: '8px 0 0 16px', paddingLeft: 0 }}>
            <li>Cek folder spam jika tidak menerima email</li>
            <li>Kode berlaku selama 10 menit</li>
            <li>Bisa copy-paste kode OTP langsung</li>
          </ul>
        </div>

        <style jsx>{`
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default OTPVerification;
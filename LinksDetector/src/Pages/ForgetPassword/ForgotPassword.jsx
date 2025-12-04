import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import { handleError, handleSuccess } from '../../utils/toastutils';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false); // ✅ new state
  const navigate = useNavigate();
   const [showPassword, setShowPassword] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return handleError('Email is required');

    setLoading(true); // ✅ start loading
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URI}/auth/request-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (result.success) {
        handleSuccess(result.message);
        setStep(2);
      } else {
        handleError(result.message);
      }
    } catch (err) {
      handleError('Something went wrong');
    } finally {
      setLoading(false); // ✅ stop loading
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!code || !newPassword) return handleError('All fields are required');

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URI}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const result = await res.json();
      if (result.success) {
        handleSuccess(result.message);
        setTimeout(() => navigate('/login'), 1000);
      } else {
        handleError(result.message);
      }
    } catch (err) {
      handleError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <form className="forgot-password-form" onSubmit={step === 1 ? handleEmailSubmit : handleCodeSubmit}>
        <h2>{step === 1 ? 'Forgot Password' : 'Enter Code & New Password'}</h2>

        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={step === 2 || loading}
          required
        />

        {step === 2 && (
          <>
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              disabled={loading}
              required
            />

            <label htmlFor="newPassword">New Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
            />
            <div className="show-password">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={() => setShowPassword(prev => !prev)}
            />
            <label htmlFor="showPassword">Show Password</label>
      </div>
          </>
        )}
         
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : step === 1 ? 'Send Code' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;

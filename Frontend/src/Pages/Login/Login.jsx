import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { handleError, handleSuccess } from '../../toastutils';

const Login = () => {
  const [step, setStep] = useState(1); 
  const [loginInfo, setLoginInfo] = useState({ email: '', password: '' });
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
      setLoading(true);
    const { email, password } = loginInfo;

    if (!email || !password) {
      handleError('All fields are required');
      setLoading(false);
      return 
    }

    try {
      const url = `${import.meta.env.VITE_API_URI}/auth/initiatelogin`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        handleSuccess('Verification code sent to your email.');
        setStep(2); // Move to code verification step
      } else {
        handleError(result.message || 'Login initiation failed.');
      }
    } catch (err) {
      handleError('Something went wrong. Try again.');
    } finally {
    setLoading(false);
  }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
     setLoading(true);

    if (!code || !loginInfo.email) {
      handleError('Verification code is required');
      setLoading(false);
      return 
    }

    try {
      const url = `${import.meta.env.VITE_API_URI}/auth/verify-code`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginInfo.email, code }),
      });

      const result = await response.json();
      const { success, message, jwtToken, user } = result;

      if (!success) {
        handleError(message || 'Invalid or expired code');
        return;
      }

      handleSuccess(message);

        
        const safeUser = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          affiliateAccess: user.affiliateAccess === true
        };

        localStorage.setItem('token', jwtToken);
        localStorage.setItem('loggedInUser', JSON.stringify(safeUser));
        localStorage.setItem('superCategory', 'natural');

       navigate(
            safeUser.role === 'admin'
              ? '/admin/products/natural'
              : '/products/natural'
          );
        } catch (err) {
          handleError('Something went wrong. Try again.');
        } finally {
          setLoading(false);
        }
    };

  return (
  <div className="bg-login">
    <div className="login-wrapper">
      <div className="login-left">
      <form className="login-form" onSubmit={step === 1 ? handleLogin : handleVerifyCode}>
        <h2>{step === 1 ? 'Login' : 'Verify Code'}</h2>
        <p>Welcome back! Please enter your details</p>

        {step === 1 && (
          <>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              onChange={handleChange}
              placeholder="email@example.com"
              required
              disabled={loading}
            />

            <label htmlFor="password">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              onChange={handleChange}
              placeholder="Enter password"
              required
               disabled={loading}
            />

            <div className="show-password">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={() => setShowPassword((prev) => !prev)}
                disabled={loading}
              />
              <label htmlFor="showPassword">Show Password</label>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              name="code"
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              required
              disabled={loading}
            />
          </>
        )}

        <button type="submit" disabled={loading}>
          {loading ? (
            <div className="spinner-login"></div> // show spinner inside button
          ) : step === 1 ? (
            'Log in'
          ) : (
            'Verify & Login'
          )}
        </button>

        {step === 1 && (
          <div className="forgot-password-link-wrapper">
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>
        )}
      </form>
      </div>
      <div
          className="login-right"
          
        ></div>
    </div>
  </div>
  );
};

export default Login;
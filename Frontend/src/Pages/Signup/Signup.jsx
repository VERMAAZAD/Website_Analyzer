
import "./Signup.css"
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {ToastContainer} from 'react-toastify';
import { handleError, handleSuccess } from "../../toastutils";
import Layout from "../AdminPanel/AdminComponents/Layouts/Layout";

const Signup = () => {
        const [signupInfo, setSignupInfo] = useState({
            name: '',
            email: '',
            password: ''
        })
        const [showPassword, setShowPassword] = useState(false);

        const handleChange = (e) => {
                const {name, value} = e.target;
                const copySignupInfo = {...signupInfo};
                copySignupInfo[name] = value;
                setSignupInfo(copySignupInfo);
        }

        const navigate = useNavigate();
        const handleSignup = async (e) => {
  e.preventDefault();
  const { name, email, password } = signupInfo;
  if (!name || !email || !password) {
    return handleError('All fields are required');
  }

  try {
    const url = `${import.meta.env.VITE_API_URI}/auth/signup`;
    const token = localStorage.getItem("token");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ✅ send token
      },
      body: JSON.stringify(signupInfo),
    });

    const result = await response.json();
    const { success, message, error } = result;

    if (success) {
      handleSuccess(message);
      setTimeout(() => {
        navigate('/admin/users');
      }, 1000);
    } else if (error) {
      const details = error?.details?.[0]?.message || error;
      handleError(details);
    } else if (!success) {
      handleError(message);
    }
  } catch (err) {
    handleError('Signup failed: ' + err.message);
  }
};


  return (
    <Layout>
     <div className="signup-container">
    <form className="signup-form" onSubmit={handleSignup}>
      <h2>Create an Account</h2>

      <label htmlFor="name">Full Name</label>
      <input type="text" id="name" name="name" onChange={handleChange} value={signupInfo.name} placeholder="John Doe"  />

      <label htmlFor="email">Email Address</label>
      <input type="email" id="email" name="email" onChange={handleChange} value={signupInfo.email} placeholder="email@example.com"  />

      <label htmlFor="password">Password</label>
      <input  type={showPassword ? "text" : "password"} id="password" name="password" onChange={handleChange} value={signupInfo.password} placeholder="Enter password"  />
       <div className="show-password">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={() => setShowPassword(prev => !prev)}
            />
            <label htmlFor="showPassword">Show Password</label>
      </div>

      <button type="submit">Sign Up</button>
    
    </form>
    <ToastContainer/>
  </div>
  </Layout>
  )
}

export default Signup;
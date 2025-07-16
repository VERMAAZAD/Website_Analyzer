
import './Login.css'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {ToastContainer} from 'react-toastify';
import { handleError, handleSuccess } from "../../utils";


const Login = () => {
    const [loginInfo, setLoginInfo] = useState({
            email: '',
            password: ''
        })

        const handleChange = (e) => {
                const {name, value} = e.target;
                const copyLoginInfo = {...loginInfo};
                copyLoginInfo[name] = value;
                setLoginInfo(copyLoginInfo);
        }

        const navigate = useNavigate();
        const handleLogin = async (e) => {
            e.preventDefault();
            const {email, password} = loginInfo;
            if(!email || !password){
                return handleError('All field are required ')
            }

             try {
            const url = `http://localhost:5000/auth/login`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginInfo)
            });
            const result = await response.json();
           const { success, message, jwtToken, user, error } = result;
            if (success) {
                handleSuccess(message);
                localStorage.setItem('token', jwtToken);
               localStorage.setItem('loggedInUser', JSON.stringify(user?.name));
                setTimeout(() => {
                   if (user.role === 'admin') {
            navigate('/admin/dashboard'); 
          } else {
            navigate('/home'); 
          }
                }, 1000)
            } else if (error) {
                const details = error?.details[0].message;
                handleError(details);
            } else if (!success) {
                handleError(message);
            }
        } catch (err) {
            handleError(err);
        }
        }

  return (
     <div className="login-container">
    <form className="login-form" onSubmit={handleLogin}>
      <h2>Login</h2>

      <label htmlFor="email">Email Address</label>
      <input type="email" id="email" name="email" onChange={handleChange} placeholder="email@example.com" required />

      <label htmlFor="password">Password</label>
      <input type="password" id="password" name="password" onChange={handleChange} placeholder="Enter password" required />

      <button type="submit">Login</button>

    </form>
    <ToastContainer/>
  </div>
  )
}

export default Login;
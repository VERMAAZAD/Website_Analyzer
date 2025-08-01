
import './Login.css'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { handleError, handleSuccess } from "../../toastutils";


const Login = () => {
    const [loginInfo, setLoginInfo] = useState({
            email: '',
            password: ''
        })
         const [showPassword, setShowPassword] = useState(false);

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
            const url = `${import.meta.env.VITE_API_URI}/auth/login`;
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
               
               localStorage.setItem('superCategory', 'natural');
                setTimeout(() => {
                   if (user.role === 'admin') {
            navigate('/admin/products/natural'); 
          } else {
            navigate(`/products/natural`);
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
      <input type={showPassword ? "text" : "password"} id="password" name="password" onChange={handleChange} placeholder="Enter password" required />
      <div className="show-password">
            <input
              type="checkbox"
              id="showPassword"
              checked={showPassword}
              onChange={() => setShowPassword(prev => !prev)}
            />
            <label htmlFor="showPassword">Show Password</label>
      </div>
      <button type="submit">Login</button>
      <div className="forgot-password-link-wrapper">
          <Link to="/forgot-password" className="forgot-password-link">
            Forgot Password?
          </Link>
        </div>
    </form>
  </div>
  )
}

export default Login;
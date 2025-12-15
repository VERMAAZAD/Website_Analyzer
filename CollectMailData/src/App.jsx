import {Navigate, Route, Routes, useNavigate} from 'react-router-dom';
import { ToastContainer } from 'react-toastify'

import './App.css'
import Login from './Pages/Login/Login';
import ForgotPassword from './Pages/ForgetPassword/ForgotPassword';
import AllmailData from './AllMailData/AllmailData';
import ProtectedRoute from './utils/ProtectedRoute';
import UserTraffic from './UserTraffic/UserTraffic';
import DomainTraffic from './DomainTraffic/DomainTraffic';
import Last7DaysTraffic from './UserTraffic/Last7DaysTraffic';
import Dashboard from './Dashboard/Dashboard';
import PagesAnalytics from './PagesAnalytics/PagesAnalytics';
import { useEffect } from 'react';

function App() {
 const navigate = useNavigate();

 const DEFAULT_ROUTE = "/dashboard";

  useEffect(() => {
     if (localStorage.getItem("token")) return;
     
  const ssoLogin = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URI}/ssoauth/sso-login`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await res.json();
      if (!data.success) return;
      localStorage.setItem("token", data.jwtToken);
      localStorage.setItem("loggedInUser", JSON.stringify(data.user));
      navigate(DEFAULT_ROUTE, { replace: true });
    } catch {
      // navigate("/login");
      console.error("SSO check failed");
    }
  };

  ssoLogin();
}, []);

  return (
    <>
        <Routes>
            <Route path="/" element={ localStorage.getItem("token")
          ? <Navigate to={DEFAULT_ROUTE} />
          : <Navigate to="/login" />
            }
        />
        <Route path='/login' element={<Login/>}/>
        <Route path='/forgot-password' element={<ForgotPassword/>}/>

        <Route path='/dashboard' element={<ProtectedRoute allowedRoles={['user', 'admin']}><Dashboard /></ProtectedRoute>}/>
        {/* <Route path='/traffic/:domain' element={<ProtectedRoute allowedRoles={['user', 'admin']}><DomainDashboard /></ProtectedRoute>}/> */}
        <Route path='/pages-analytics' element={<ProtectedRoute allowedRoles={['user', 'admin']}><PagesAnalytics /></ProtectedRoute>}/>
        <Route path='/mail-collection' element={<ProtectedRoute allowedRoles={['user', 'admin']}><AllmailData /></ProtectedRoute>}/>
        <Route path='/user-traffic' element={<ProtectedRoute allowedRoles={['user', 'admin']}><UserTraffic /></ProtectedRoute>}/>
        <Route path='/traffic/:domain' element={<ProtectedRoute allowedRoles={['user', 'admin']}><DomainTraffic /></ProtectedRoute>}/>
        <Route path='/traffic/last7days' element={<ProtectedRoute allowedRoles={['user', 'admin']}><Last7DaysTraffic /></ProtectedRoute>}/>
      </Routes>
      <ToastContainer/>
    </>
  )
}

export default App

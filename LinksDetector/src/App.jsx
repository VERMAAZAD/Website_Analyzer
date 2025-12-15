import {Navigate, Route, Routes, useNavigate} from 'react-router-dom';
import { ToastContainer } from 'react-toastify'

import './App.css'
import Login from './Pages/Login/Login';
import ForgotPassword from './Pages/ForgetPassword/ForgotPassword';
import ProtectedRoute from './utils/ProtectedRoute';
import CreateLink from './CreateLink/CreateLink';
import AnalyticsPage from './AnalyticsPage/AnalyticsPage';
import ChainLinks from './AllLinks/ChainLinks';
import SingleLinks from './AllLinks/SingleLinks';
import FolderList from './FolderBrowser/FolderList';
import FolderDetails from './FolderBrowser/FolderDetails';
import { useEffect } from 'react';

function App() {
  const navigate = useNavigate();

 const DEFAULT_ROUTE = "/folders";

  useEffect(() => {
     if (localStorage.getItem("token")) return;
     
  const ssoLogin = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URI}/ssoauth/sso-login`,
        {
          method: "POST",
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

         <Route path='/createlink' element={<ProtectedRoute allowedRoles={['user', 'admin']}><CreateLink /></ProtectedRoute>}/>
         <Route path='/analytics/:slug' element={<ProtectedRoute allowedRoles={['user', 'admin']}><AnalyticsPage /></ProtectedRoute>}/>
         <Route path='/domain-links' element={<ProtectedRoute allowedRoles={['user', 'admin']}><SingleLinks /></ProtectedRoute>}/>
         <Route path='/domain-chain-links' element={<ProtectedRoute allowedRoles={['user', 'admin']}><ChainLinks /></ProtectedRoute>}/>
         <Route path='/folders' element={<ProtectedRoute allowedRoles={['user', 'admin']}><FolderList /></ProtectedRoute>}/>
         <Route path='/folder/:name' element={<ProtectedRoute allowedRoles={['user', 'admin']}><FolderDetails /></ProtectedRoute>}/>
      
       
      </Routes>
      <ToastContainer/>
    </>
  )
}

export default App

import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

import './App.css'
import Login from './Pages/Login/Login';
import Signup from './Pages/Signup/Signup';
import Home from './Pages/Home/Home';
import Dashboard from './Pages/AdminPanel/DashBoard/Dashboard';
import Users from './Pages/AdminPanel/AdminComponents/UserData/Users';
import ProtectedRoute from './components/ProtectedRoute';
import UserDomains from './Pages/AdminPanel/AdminComponents/UserDomian/UserDomains';
import ErrorAffiliatesUser from './Pages/Website-Info/ErrorAffiliate/ErrorAffiliateUser';
import ErrorAffiliatesAdmin from './Pages/Website-Info/ErrorAffiliate/ErrorAffiliateAdmin';
import DomainListUser from './Pages/Website-Info/DomainList/DomainListUser';
import DomainListAdmin from './Pages/Website-Info/DomainList/DomainListAdmin';
import ErrorDomainUser from './Pages/Website-Info/ErrorDomain/ErrorDomainUser';
import ErrorDomainAdmin from './Pages/Website-Info/ErrorDomain/ErrorDomainAdmin';
import DomainExpireAdmin from './Pages/Website-Info/DomainExpire/DomainExpireAdmin';
import DomainExpireUser from './Pages/Website-Info/DomainExpire/DomainExpireUser';
import ForgotPassword from './Pages/ForgetPassword/ForgotPassword';
import UrlScanUser from './Pages/Website-Info/UrlScan/UrlScanUser';
import UrlScanAdmin from './Pages/Website-Info/UrlScan/UrlScanAdmin';
import BingCheckerUser from './components/BingChecker/BingCheckerUser';
import BingCheckerAdmin from './components/BingChecker/BingCheckerAdmin';
import { handleError } from './toastutils';



function App() {
     const preloadAffiliateErrors = async () => {
      try {
        const cached = localStorage.getItem("cachedErrorAffiliate");
        if (!cached) {
          const res = await axios.get(`${import.meta.env.VITE_API_URI}/api/scraper/check-affiliate-errors`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          const data = res.data.errors || [];
          localStorage.setItem("cachedErrorAffiliate", JSON.stringify(data));
        }
      } catch (err) {
        handleError("❌ Failed to preload affiliate errors");
      }
    };

    

const preloadErrorDomains = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URI}/api/scraper/refresh-and-errors`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        localStorage.setItem("cachedErrorDomains", JSON.stringify(res.data));
      } catch (err) {
        console.error("❌ Error preloading domains", err);
      }
    };

 useEffect(() => {
    preloadErrorDomains();
    preloadAffiliateErrors();
  }, []);

  return (
  <>
      <Routes>
      <Route path='/' element={<Navigate to="/login"/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/forgot-password' element={<ForgotPassword/>}/>
      


        {/* Protected User & Admin Routes */}
        <Route path='/home' element={<ProtectedRoute allowedRoles={['user', 'admin']}><Home /></ProtectedRoute>}/>
        <Route path='/urlscan' element={<ProtectedRoute allowedRoles={['user']}><UrlScanUser /></ProtectedRoute>}/>
        <Route path='/domains' element={<ProtectedRoute allowedRoles={['user']}><DomainListUser /></ProtectedRoute>}/>
        <Route path='/domain-errors' element={<ProtectedRoute allowedRoles={['user']}><ErrorDomainUser /></ProtectedRoute>}/>
        <Route path='/affiliate-errors' element={<ProtectedRoute allowedRoles={['user']}><ErrorAffiliatesUser /></ProtectedRoute>}/>
        <Route path='/domain-expire' element={<ProtectedRoute allowedRoles={['user']}><DomainExpireUser /></ProtectedRoute>}/>
        <Route path='/not-index' element={<ProtectedRoute allowedRoles={['user']}><BingCheckerUser /></ProtectedRoute>}/>
        

      {/* Admin Routes */}
      <Route path='/admin/signup' element={<ProtectedRoute allowedRoles={['admin']}><Signup /></ProtectedRoute>}/>
      <Route path='/admin/urlscan' element={<ProtectedRoute allowedRoles={['admin']}><UrlScanAdmin /></ProtectedRoute>}/>
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><Users /></ProtectedRoute>} />
      <Route path="/admin/user/:id/domains/:name" element={<ProtectedRoute allowedRoles={['admin']}><UserDomains /></ProtectedRoute>} />
      <Route path='/admin/affiliate-errors' element={<ProtectedRoute allowedRoles={['admin']}><ErrorAffiliatesAdmin /></ProtectedRoute>}/>
      <Route path='/admin/domains' element={<ProtectedRoute allowedRoles={['admin']}><DomainListAdmin /></ProtectedRoute>}/>
      <Route path='/admin/domain-errors' element={<ProtectedRoute allowedRoles={['admin']}><ErrorDomainAdmin /></ProtectedRoute>}/>
      <Route path='/admin/domain-expire' element={<ProtectedRoute allowedRoles={['admin']}><DomainExpireAdmin /></ProtectedRoute>}/>
      <Route path='/admin/not-index' element={<ProtectedRoute allowedRoles={['admin']}><BingCheckerAdmin /></ProtectedRoute>}/>
    
      </Routes>
      <ToastContainer/>
  </>
  )
}

export default App

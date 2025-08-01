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
   const superCategory = localStorage.getItem("superCategory") || "natural"; 
  const apiBase = superCategory === "casino"
    ? "casino/scraper"
    : superCategory === "dating"
    ? "dating/scraper"
    : "api/scrape";
     const preloadAffiliateErrors = async () => {
      try {
        const cached = localStorage.getItem("cachedErrorAffiliate");
        if (!cached) {
          const res = await axios.get(`${import.meta.env.VITE_API_URI}/${apiBase}/check-affiliate-errors`, {
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
          `${import.meta.env.VITE_API_URI}/${apiBase}/refresh-and-errors`,
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
        <Route path='/products/:type' element={<ProtectedRoute allowedRoles={['user', 'admin']}><Home /></ProtectedRoute>}/>
        <Route path='/urlscan/:type' element={<ProtectedRoute allowedRoles={['user']}><UrlScanUser /></ProtectedRoute>}/>
        <Route path='/domains/' element={<ProtectedRoute allowedRoles={['user']}><DomainListUser /></ProtectedRoute>}/>
        <Route path='/domain-errors/:type' element={<ProtectedRoute allowedRoles={['user']}><ErrorDomainUser /></ProtectedRoute>}/>
        <Route path='/affiliate-errors/:type' element={<ProtectedRoute allowedRoles={['user']}><ErrorAffiliatesUser /></ProtectedRoute>}/>
        <Route path='/domain-expire/:type' element={<ProtectedRoute allowedRoles={['user']}><DomainExpireUser /></ProtectedRoute>}/>
        <Route path='/not-index/:type' element={<ProtectedRoute allowedRoles={['user']}><BingCheckerUser /></ProtectedRoute>}/>
        

      {/* Admin Routes */}
      <Route path='/admin/signup' element={<ProtectedRoute allowedRoles={['admin']}><Signup /></ProtectedRoute>}/>
      <Route path='/admin/urlscan/:type' element={<ProtectedRoute allowedRoles={['admin']}><UrlScanAdmin /></ProtectedRoute>}/>
      <Route path="/admin/products/:type" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><Users /></ProtectedRoute>} />
      <Route path="/admin/user/:userId/domains" element={<ProtectedRoute allowedRoles={['admin']}><UserDomains /></ProtectedRoute>} />
      <Route path='/admin/affiliate-errors/:type' element={<ProtectedRoute allowedRoles={['admin']}><ErrorAffiliatesAdmin /></ProtectedRoute>}/>
      <Route path='/admin/domains/:type' element={<ProtectedRoute allowedRoles={['admin']}><DomainListAdmin /></ProtectedRoute>}/>
      <Route path='/admin/domain-errors/:type' element={<ProtectedRoute allowedRoles={['admin']}><ErrorDomainAdmin /></ProtectedRoute>}/>
      <Route path='/admin/domain-expire/:type' element={<ProtectedRoute allowedRoles={['admin']}><DomainExpireAdmin /></ProtectedRoute>}/>
      <Route path='/admin/not-index/:type' element={<ProtectedRoute allowedRoles={['admin']}><BingCheckerAdmin /></ProtectedRoute>}/>
      </Routes>
      <ToastContainer/>
  </>
  )
}

export default App

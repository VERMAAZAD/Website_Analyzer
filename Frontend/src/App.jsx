import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './App.css'
import Login from './Pages/Login/Login';
import Signup from './Pages/Signup/Signup';
import Home from './Pages/Home/Home';
import UrlScan from './Pages/Website-Info/UrlScan/UrlScan';
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



function App() {
  return (
  <>
      <Routes>
      <Route path='/' element={<Navigate to="/login"/>}/>
      <Route path='/login' element={<Login/>}/>


        {/* Protected User & Admin Routes */}
        <Route path='/home' element={<ProtectedRoute allowedRoles={['user', 'admin']}><Home /></ProtectedRoute>}/>
        <Route path='/urlscan' element={<ProtectedRoute allowedRoles={['user', 'admin']}><UrlScan /></ProtectedRoute>}/>
        <Route path='/domains' element={<ProtectedRoute allowedRoles={['user']}><DomainListUser /></ProtectedRoute>}/>
        <Route path='/domain-errors' element={<ProtectedRoute allowedRoles={['user']}><ErrorDomainUser /></ProtectedRoute>}/>
        <Route path='/affiliate-errors' element={<ProtectedRoute allowedRoles={['user']}><ErrorAffiliatesUser /></ProtectedRoute>}/>
        <Route path='/domain-expire' element={<ProtectedRoute allowedRoles={['user']}><DomainExpireUser /></ProtectedRoute>}/>
       

      {/* Admin Routes */}
      <Route path='/admin/signup' element={<ProtectedRoute allowedRoles={['admin']}><Signup /></ProtectedRoute>}/>
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><Users /></ProtectedRoute>} />
      <Route path="/admin/user/:id/domains/:name" element={<ProtectedRoute allowedRoles={['admin']}><UserDomains /></ProtectedRoute>} />
      <Route path='/admin/affiliate-errors' element={<ProtectedRoute allowedRoles={['admin']}><ErrorAffiliatesAdmin /></ProtectedRoute>}/>
      <Route path='/admin/domains' element={<ProtectedRoute allowedRoles={['admin']}><DomainListAdmin /></ProtectedRoute>}/>
      <Route path='/admin/domain-errors' element={<ProtectedRoute allowedRoles={['admin']}><ErrorDomainAdmin /></ProtectedRoute>}/>
      <Route path='/admin/domain-expire' element={<ProtectedRoute allowedRoles={['admin']}><DomainExpireAdmin /></ProtectedRoute>}/>

      
      </Routes>
      <ToastContainer/>
  </>
  )
}

export default App

import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
import ServerExpireUser from './Pages/HostingInfo/ServerExpire/ServerExpireUser';
import ServerExpireAdmin from './Pages/HostingInfo/ServerExpire/ServerExpireAdmin';
import HostingInfoFormUser from './Pages/HostingInfo/HostingInfoForm/HostingInfoFormUser';
import HostingInfoFormAdmin from './Pages/HostingInfo/HostingInfoForm/HostingInfoFormAdmin';
import HostingInfoListUser from './Pages/HostingInfo/HostingInfoList/HostingInfoListUser';
import HostingInfoListAdmin from './Pages/HostingInfo/HostingInfoList/HostingInfoListAdmin';
import HostingDomainsUser from './Pages/HostingInfo/HostingDomains/HostingDomainsUser';
import HostingDomainsAdmin from './Pages/HostingInfo/HostingDomains/HostingDomainsAdmin';
import ServerListUser from './Pages/HostingInfo/ServerList/ServerListUser';
import ServerListAdmin from './Pages/HostingInfo/ServerList/ServerListAdmin';
import SubUserManagement from './Pages/SubUserManagement/SubUserManagement';


function App() {
  return (
  <>
      <Routes>
      <Route path='/' element={<Navigate to="/login"/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/forgot-password' element={<ForgotPassword/>}/>

        {/* Protected User & Admin Routes */}
        <Route path='/products/:type' element={<ProtectedRoute allowedRoles={['user', 'admin', 'sub-user']}><Home /></ProtectedRoute>}/>
        <Route path='/urlscan/:type' element={<ProtectedRoute allowedRoles={['user', 'sub-user']}><UrlScanUser /></ProtectedRoute>}/>
        <Route path='/domains/' element={<ProtectedRoute allowedRoles={['user', 'sub-user']}><DomainListUser /></ProtectedRoute>}/>
        <Route path='/domain-errors/:type' element={<ProtectedRoute allowedRoles={['user', 'sub-user']}><ErrorDomainUser /></ProtectedRoute>}/>
        <Route path='/affiliate-errors/:type' element={<ProtectedRoute allowedRoles={['user', 'sub-user']}><ErrorAffiliatesUser /></ProtectedRoute>}/>
        <Route path='/domain-expire/:type' element={<ProtectedRoute allowedRoles={['user', 'sub-user']}><DomainExpireUser /></ProtectedRoute>}/>
        <Route path='/hosting-expire/:type' element={<ProtectedRoute allowedRoles={['user', 'sub-user']}><ServerExpireUser /></ProtectedRoute>}/>
        <Route path='/not-index/:type' element={<ProtectedRoute allowedRoles={['user', 'sub-user']}><BingCheckerUser /></ProtectedRoute>}/>
        <Route path='/hosting-form' element={<ProtectedRoute allowedRoles={['user', 'sub-user']}><HostingInfoFormUser /></ProtectedRoute>}/>
        <Route path='/hosting-data' element={<ProtectedRoute allowedRoles={['user', 'sub-user']}><HostingInfoListUser /></ProtectedRoute>}/>
        <Route path='/hosting/domains/:email/:server' element={<ProtectedRoute allowedRoles={['user', 'sub-user']}><HostingDomainsUser /></ProtectedRoute>}/>
        <Route path='/servers/:email' element={<ProtectedRoute allowedRoles={['user', 'sub-user']}><ServerListUser /></ProtectedRoute>}/>
        <Route path='/subusers' element={<ProtectedRoute allowedRoles={['user', 'sub-user']}><SubUserManagement /></ProtectedRoute>}/>


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
      <Route path='/admin/hosting-expire/:type' element={<ProtectedRoute allowedRoles={['admin']}><ServerExpireAdmin /></ProtectedRoute>}/>
      <Route path='/admin/not-index/:type' element={<ProtectedRoute allowedRoles={['admin']}><BingCheckerAdmin /></ProtectedRoute>}/>
      <Route path='/admin/hosting-form' element={<ProtectedRoute allowedRoles={['admin']}><HostingInfoFormAdmin /></ProtectedRoute>}/>
      <Route path='/admin/hosting-data' element={<ProtectedRoute allowedRoles={['admin']}><HostingInfoListAdmin /></ProtectedRoute>}/>
      <Route path='/admin/hosting/domains/:email/:server' element={<ProtectedRoute allowedRoles={['admin']}><HostingDomainsAdmin /></ProtectedRoute>}/>
      <Route path='/admin/servers/:email' element={<ProtectedRoute allowedRoles={['admin']}><ServerListAdmin /></ProtectedRoute>}/>

      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
        containerClassName="custom-toast-container"
      />

  </>
  )
}

export default App

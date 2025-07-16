import { Navigate, Route, Routes } from 'react-router-dom';

import './App.css'
import Login from './Pages/Login/Login';
import Signup from './Pages/Signup/Signup';
import Home from './Pages/Home/Home';
import UrlScan from './Pages/Website-Info/UrlScan/UrlScan';
import DomainList from './Pages/Website-Info/DomainList/DomainList';
import ErrorDomains from './Pages/Website-Info/ErrorDomain/ErrorDomain';
import Dashboard from './Pages/AdminPanel/DashBoard/Dashboard';
import Users from './Pages/AdminPanel/AdminComponents/UserData/Users';
import AllDomains from './Pages/AdminPanel/AllDomain/AllDomains';
import ProtectedRoute from './components/ProtectedRoute';
import UserDomains from './Pages/AdminPanel/AdminComponents/UserDomian/UserDomains';



function App() {
  return (
  <>
      <Routes>
      <Route path='/' element={<Navigate to="/login"/>}/>
      <Route path='/login' element={<Login/>}/>
      {/* <Route path='/signup' element={<Signup/>}/> */}


        {/* Protected User Routes */}
        <Route path='/home' element={<ProtectedRoute allowedRoles={['user', 'admin']}><Home /></ProtectedRoute>}/>
        <Route path='/urlscan' element={<ProtectedRoute allowedRoles={['user', 'admin']}><UrlScan /></ProtectedRoute>}/>
        <Route path='/domains' element={<ProtectedRoute allowedRoles={['user', 'admin']}><DomainList /></ProtectedRoute>}/>
        <Route path='/errors' element={<ProtectedRoute allowedRoles={['user', 'admin']}><ErrorDomains /></ProtectedRoute>}/>

      {/* Admin Routes */}
      <Route path='/signup' element={<ProtectedRoute allowedRoles={['admin']}><Signup /></ProtectedRoute>}/>
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><Users /></ProtectedRoute>} />
      <Route path="/admin/domains" element={<ProtectedRoute allowedRoles={['admin']}><AllDomains /></ProtectedRoute>} />
      <Route path="/admin/user/:id/domains/:name" element={<ProtectedRoute allowedRoles={['admin']}><UserDomains /></ProtectedRoute>} />
      
      </Routes>
  </>
  )
}

export default App

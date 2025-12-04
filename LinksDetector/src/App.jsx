import {Navigate, Route, Routes} from 'react-router-dom';
import { ToastContainer } from 'react-toastify'

import './App.css'
import Login from './Pages/Login/Login';
import ForgotPassword from './Pages/ForgetPassword/ForgotPassword';
import ProtectedRoute from './utils/ProtectedRoute';
import CreateLink from './CreateLink/CreateLink';
import AnalyticsPage from './AnalyticsPage/AnalyticsPage';
import ChainLinks from './AllLinks/ChainLinks';
import SingleLinks from './AllLinks/SingleLinks';

function App() {
  return (
    <>
     <Routes>
        <Route path='/' element={<Navigate to="/login"/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/forgot-password' element={<ForgotPassword/>}/>

         <Route path='/createlink' element={<ProtectedRoute allowedRoles={['user', 'admin']}><CreateLink /></ProtectedRoute>}/>
         <Route path='/analytics/:slug' element={<ProtectedRoute allowedRoles={['user', 'admin']}><AnalyticsPage /></ProtectedRoute>}/>
         <Route path='/domain-links' element={<ProtectedRoute allowedRoles={['user', 'admin']}><SingleLinks /></ProtectedRoute>}/>
         <Route path='/domain-chain-links' element={<ProtectedRoute allowedRoles={['user', 'admin']}><ChainLinks /></ProtectedRoute>}/>
      
       
      </Routes>
      <ToastContainer/>
    </>
  )
}

export default App

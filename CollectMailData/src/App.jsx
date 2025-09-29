import {Navigate, Route, Routes} from 'react-router-dom';
import { ToastContainer } from 'react-toastify'

import './App.css'
import Login from './Pages/Login/Login';
import ForgotPassword from './Pages/ForgetPassword/ForgotPassword';
import AllmailData from './AllMailData/AllmailData';
import SubscribeForm from './AllMailData/SubscribeForm';
import ProtectedRoute from './utils/ProtectedRoute';

function App() {
  return (
    <>
     <Routes>
        <Route path='/' element={<Navigate to="/login"/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/forgot-password' element={<ForgotPassword/>}/>

        <Route path='/mailcollection' element={<ProtectedRoute allowedRoles={['user', 'admin']}><AllmailData /></ProtectedRoute>}/>
        <Route path='/addmaildata' element={<ProtectedRoute allowedRoles={['user', 'admin']}><SubscribeForm /></ProtectedRoute>}/>
      </Routes>
      <ToastContainer/>
    </>
  )
}

export default App

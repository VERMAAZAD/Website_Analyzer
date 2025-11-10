import {Navigate, Route, Routes} from 'react-router-dom';
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
// import DomainDashboard from './Dashboard/DomainDashboard';

function App() {
  return (
    <>
     <Routes>
        <Route path='/' element={<Navigate to="/login"/>}/>
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

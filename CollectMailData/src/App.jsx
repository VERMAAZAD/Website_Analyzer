import {Route, Routes} from 'react-router-dom';

import './App.css'
import AllmailData from './AllMailData/AllmailData';

function App() {
  

  return (
    <>
     <Routes>
        <Route path='/' element={<AllmailData/>}/>
      </Routes>
    </>
  )
}

export default App

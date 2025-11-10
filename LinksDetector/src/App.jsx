import {Route, Routes} from 'react-router-dom';
import { ToastContainer } from 'react-toastify'

import GenerateLinks from './GenerateLinks/GenerateLinks';
import GeneratedLinksTable from './GeneratedLinksTable/GeneratedLinksTable';
import BaseDomainManager from './BaseDomainManager/BaseDomainManager';
import LinkDetails from './GeneratedLinksTable/LinkDetails';

function App() {
  return (
    <>
     <Routes>
        <Route path='/' element={<GenerateLinks/>}/>
        <Route path='/all-links' element={<GeneratedLinksTable/>}/>
        <Route path='/generate-baseurl' element={<BaseDomainManager/>}/>
        <Route path="/links/:id" element={<LinkDetails />} />
      </Routes>
      <ToastContainer/>
    </>
  )
}

export default App

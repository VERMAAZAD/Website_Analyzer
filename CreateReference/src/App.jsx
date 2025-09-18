import {Route, Routes } from 'react-router-dom';
import './App.css'
import ReferenceForm from './ReferenceForm/ReferenceForm';

function App() {
  return (
    <>
       <Routes>
      <Route path='/' element={<ReferenceForm/>}/>
      </Routes>
    </>
  )
}

export default App

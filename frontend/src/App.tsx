import { useState } from 'react'
import './App.css'
import Login from './components/Login'

function App() {
  const [authenticated, setAuthenticated] = useState(false)

  return (
    <div className="App">
      {!authenticated && <Login setAuthencated={setAuthenticated} />}
    </div>
  )
}

export default App

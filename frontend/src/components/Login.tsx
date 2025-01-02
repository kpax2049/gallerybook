import React, { useState } from 'react'
import {
  Button,
  ControlGroup,
  InputGroup,
  Intent,
  Toaster,
  Position,
} from '@blueprintjs/core'
import './Login.css'

const Login: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    // Simulate a login process
    if (username && password) {
      Toaster.create({ position: Position.TOP }).show({
        message: 'Login successful!',
        intent: Intent.SUCCESS,
      })
    } else {
      Toaster.create({ position: Position.TOP }).show({
        message: 'Please enter valid credentials.',
        intent: Intent.DANGER,
      })
    }
  }

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <ControlGroup vertical={true}>
          <InputGroup
            leftIcon="user"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <InputGroup
            leftIcon="lock"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </ControlGroup>
        <Button
          type="submit"
          text="Login"
          intent={Intent.PRIMARY}
          fill={true}
          style={{ marginTop: '16px' }}
        />
      </form>
    </div>
  )
}

export default Login

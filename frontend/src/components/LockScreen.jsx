import { useState } from 'react'

function LockScreen({ onUnlock }) {
  const [token, setToken] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (token.trim()) {
      onUnlock(token.trim())
    }
  }

  return (
    <form className="lock-screen" onSubmit={handleSubmit}>
      <h1>Cloud Terminal</h1>
      <p>Enter access token</p>
      <input
        aria-label="Access token"
        type="password"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        placeholder="SOCKET_AUTH_TOKEN"
      />
      <button type="submit">Unlock</button>
    </form>
  )
}

export default LockScreen

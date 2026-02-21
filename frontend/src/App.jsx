import { useEffect, useMemo, useState } from 'react'
import './App.css'
import LockScreen from './components/LockScreen'
import SessionSidebar from './components/SessionSidebar'
import TerminalView from './components/TerminalView'
import VirtualKeyboard from './components/VirtualKeyboard'
import { createSocket } from './services/socketClient'

function App() {
  const [token, setToken] = useState('')
  const [windows, setWindows] = useState([])
  const [connected, setConnected] = useState(false)

  const socket = useMemo(() => {
    if (!token) return null
    return createSocket(token)
  }, [token])

  useEffect(() => {
    if (!socket) return undefined

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onSessionList = ({ windows: nextWindows }) => setWindows(nextWindows || [])

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('session:list', onSessionList)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('session:list', onSessionList)
      socket.disconnect()
    }
  }, [socket])

  if (!token) {
    return <LockScreen onUnlock={setToken} />
  }

  return (
    <div className="app-layout">
      <SessionSidebar
        windows={windows}
        onRefresh={() => socket?.emit('session:list')}
        onSwitch={(windowIndex) => socket?.emit('session:switch', { windowIndex })}
      />
      <main>
        <header>
          <strong>{connected ? 'Connected' : 'Connecting...'}</strong>
          <button type="button" onClick={() => setToken('')}>
            Lock
          </button>
        </header>
        <TerminalView socket={socket} />
        <VirtualKeyboard onSend={(data) => socket?.emit('terminal:input', { data })} />
      </main>
    </div>
  )
}

export default App

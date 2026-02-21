import { useEffect, useRef } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import 'xterm/css/xterm.css'

function TerminalView({ socket }) {
  const terminalRef = useRef(null)
  const termInstance = useRef(null)

  useEffect(() => {
    const terminal = new Terminal({
      convertEol: true,
      cursorBlink: true,
      theme: { background: '#0f172a' },
    })
    const fitAddon = new FitAddon()

    terminal.loadAddon(fitAddon)
    terminal.open(terminalRef.current)
    fitAddon.fit()

    termInstance.current = terminal

    const onDataDisposable = terminal.onData((data) => {
      socket?.emit('terminal:input', { data })
    })

    const handleResize = () => {
      fitAddon.fit()
      socket?.emit('terminal:resize', {
        cols: terminal.cols,
        rows: terminal.rows,
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      onDataDisposable.dispose()
      window.removeEventListener('resize', handleResize)
      terminal.dispose()
    }
  }, [socket])

  useEffect(() => {
    if (!socket || !termInstance.current) return undefined

    const handleOutput = ({ data }) => {
      termInstance.current.write(data)
    }

    socket.on('terminal:output', handleOutput)
    return () => socket.off('terminal:output', handleOutput)
  }, [socket])

  return <div className="terminal" ref={terminalRef} />
}

export default TerminalView

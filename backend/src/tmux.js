const { exec } = require('node:child_process')
const { promisify } = require('node:util')

const execAsync = promisify(exec)

function parseTmuxWindows(output) {
  return output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [index, name, activeRaw] = line.split('|')
      return {
        index: Number(index),
        name,
        active: activeRaw === '1',
      }
    })
}

async function ensureSession(sessionName) {
  const escaped = sessionName.replace(/'/g, "'\\''")
  try {
    await execAsync(`tmux has-session -t '${escaped}'`)
  } catch {
    try {
      await execAsync(`tmux new-session -d -s '${escaped}'`)
    } catch (error) {
      if (!String(error?.stderr || '').includes('duplicate session')) {
        throw error
      }
    }
  }
}

async function listWindows(sessionName) {
  const escaped = sessionName.replace(/'/g, "'\\''")
  const { stdout } = await execAsync(
    `tmux list-windows -t '${escaped}' -F '#I|#W|#{window_active}'`,
  )
  return parseTmuxWindows(stdout)
}

async function switchWindow(sessionName, windowIndex) {
  const escaped = sessionName.replace(/'/g, "'\\''")
  await execAsync(`tmux select-window -t '${escaped}:${windowIndex}'`)
}

module.exports = {
  ensureSession,
  listWindows,
  parseTmuxWindows,
  switchWindow,
}

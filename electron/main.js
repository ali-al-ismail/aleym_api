const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const net = require('net')
const fs = require('fs')

let backendProcess

function getNetworkConfig() {
  const configPath = path.join(app.getPath('appData'), 'aleym', 'server.toml')
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8')
    const port = content.match(/port\s*=\s*(\d+)/)
    const host = content.match(/host\s*=\s*"([^"]+)"/)
    return {
      port: port ? parseInt(port[1]) : 3000,
      host: host ? host[1] : '127.0.0.1'
    }
  }
  return { port: 3000, host: '127.0.0.1' }
}

function waitForPort(port, host, retries = 20) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const sock = net.createConnection(port, host)
      sock.once('connect', () => { sock.destroy(); resolve() })
      sock.once('error', () => {
        if (retries-- <= 0) return reject(new Error('Backend did not start'))
        setTimeout(attempt, 300)
      })
    }
    attempt()
  })
}

app.on('ready', async () => {
  const { port, host } = getNetworkConfig()
  const binaryName = process.platform === 'win32' ? 'aleym_api.exe' : 'aleym_api'
  const binaryPath = path.join(process.resourcesPath, binaryName)

  backendProcess = spawn(binaryPath, [], {
    cwd: path.join(app.getPath('appData'), 'aleym')
  })

  backendProcess.stderr.on('data', d => console.error(d.toString()))

  await waitForPort(port, host)

  const win = new BrowserWindow({ width: 1280, height: 800, autoHideMenuBar: true })
  win.loadURL(`http://${host}:${port}`)
})

app.on('will-quit', () => {
  backendProcess?.kill()
})
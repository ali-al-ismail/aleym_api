const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const net = require('net')
const fs = require('fs')

let backendProcess
let tray
let win
app.setName('Aleym')
const { shell } = require('electron')



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
        if (retries-- <= 0) return reject(new Error("aleym_api failed to start"))
        setTimeout(attempt, 300)
      })
    }
    attempt()
  })
}

function createTray() {
  const iconFile = process.platform === 'darwin' ? 'trayTemplate.png' : 'tray.png'
  const icon = nativeImage.createFromPath(path.join(__dirname, iconFile))
  if (process.platform === 'darwin') {
    icon.setTemplateImage(true)
  }
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open',
      click: () => {
        win.show()
        win.focus()
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuiting = true
        app.quit()
      }
    },
    ...(process.platform != 'linux' ? [{
      label: 'Launch on Startup',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: () => {
        app.setLoginItemSettings({
          openAtLogin: !app.getLoginItemSettings().openAtLogin
        })
      }
    }] : [])
  ])

  tray.setToolTip('Aleym')
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    win.show()
    win.focus()
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

  win = new BrowserWindow({ width: 1280, height: 800, autoHideMenuBar: true, icon: path.join(__dirname, 'icon.png') })
  win.loadURL(`http://${host}:${port}`)

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://${host}:${port}`)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  win.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault()
      win.hide()
    }
  })

  Menu.setApplicationMenu(null)
  createTray()
})

app.on('will-quit', () => {
  backendProcess?.kill()
})
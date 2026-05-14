const { app, BrowserWindow, Tray, Menu, nativeImage, dialog, shell } = require(
  "electron",
);
const { spawn } = require("child_process");
const path = require("path");
const net = require("net");
const fs = require("fs");

let backendProcess;
let tray;
let win;
app.setName("Aleym");

async function checkForUpdates() {
  try {
    const request = fetch(
      "https://api.github.com/repos/ali-al-ismail/aleym_api/releases/latest",
    );
    const response = await request;
    const data = await response.json();
    if (!data.tag_name) return;
    const latestVersion = data.tag_name.replace(/^v/, "");
    const currentVersion = app.getVersion();

    if (latestVersion == currentVersion) return;

    const result = await dialog.showMessageBox(win, {
      type: "info",
      buttons: ["Download", "Later"],
      title: "Update Available",
      message: `A new version of Aleym is available (v${latestVersion})`,
      detail: `You are currently on (v${currentVersion}).`,
    });
    if (result.response === 0) {
      shell.openExternal(
        "https://github.com/ali-al-ismail/aleym_api/releases/latest",
      );
    }
  } catch (err) {
    console.error("Error checking for updates:", err);
  }
}

function getNetworkConfig() {
  const configPath = path.join(app.getPath("appData"), "aleym", "server.toml");
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, "utf8");
    const port = content.match(/port\s*=\s*(\d+)/);
    const host = content.match(/host\s*=\s*"([^"]+)"/);
    return {
      port: port ? parseInt(port[1]) : 42795,
      host: host ? host[1] : "127.0.0.1",
    };
  }
  return { port: 42795, host: "127.0.0.1" };
}

function waitForPort(port, host, retries = 20) {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const sock = net.createConnection(port, host);
      sock.once("connect", () => {
        sock.destroy();
        resolve();
      });
      sock.once("error", () => {
        if (retries-- <= 0) {
          return reject(new Error("aleym_api failed to start"));
        }
        setTimeout(attempt, 300);
      });
    };
    attempt();
  });
}

function createTray() {
  const iconFile = process.platform === "darwin"
    ? "icons/trayTemplate.png"
    : "icons/tray.png";
  const icon = nativeImage.createFromPath(path.join(__dirname, iconFile));
  if (process.platform === "darwin") {
    icon.setTemplateImage(true);
  }
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Check for Updates",
      click: () => {
        checkForUpdates();
      },
    },
    ...(process.platform != "linux"
      ? [{
        label: "Launch on Startup",
        type: "checkbox",
        checked: app.getLoginItemSettings().openAtLogin,
        click: () => {
          app.setLoginItemSettings({
            openAtLogin: !app.getLoginItemSettings().openAtLogin,
          });
        },
      }]
      : []),
    {
      type: "separator",
    },
    {
      label: "Open",
      click: () => {
        win.show();
        win.focus();
      },
    },
    {
      label: "Quit",
      click: () => {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Aleym");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    win.show();
    win.focus();
  });
}

app.on("ready", async () => {
  const { port, host } = getNetworkConfig();
  const binaryName = process.platform === "win32"
    ? "aleym_api.exe"
    : "aleym_api";
  const binaryPath = path.join(process.resourcesPath, binaryName);

  const cwd = path.join(app.getPath("appData"), "aleym")
  fs.mkdirSync(cwd, { recursive: true })

  backendProcess = spawn(binaryPath, [], {
    cwd: cwd,
  })

  backendProcess.stderr.on("data", (d) => console.error(d.toString()));
  backendProcess.stdout.on("data", (d) => console.log(d.toString()));

  await waitForPort(port, host);

  win = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "icons", "icon.png"),
  });
  win.loadURL(`http://${host}:${port}`);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(`http://${host}:${port}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.on("close", (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      win.hide();
    }
  });

  Menu.setApplicationMenu(null);
  createTray();
});

app.on("will-quit", () => {
  backendProcess?.kill();
});

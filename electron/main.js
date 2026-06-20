const path = require("node:path");
const { app, BrowserWindow, shell } = require("electron");
const { updateElectronApp, UpdateSourceType } = require("update-electron-app");

if (require("electron-squirrel-startup")) {
  app.quit();
}

function configureAutomaticUpdates() {
  if (!app.isPackaged) return;

  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.ElectronPublicUpdateService,
      repo: "claudiosfpessoa/crm-multivisao-pos-venda"
    },
    updateInterval: "10 minutes",
    logger: console
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#f4f6f8",
    title: "CRM Pós-venda Multivisão",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, "..", "index.html"));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("file://")) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
  });
}

app.whenReady().then(() => {
  configureAutomaticUpdates();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

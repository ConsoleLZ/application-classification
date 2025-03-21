import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  screen,
  Tray,
  MenuItemConstructorOptions,
} from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { exec } from "child_process";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;
let tray: Tray | null = null;

declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}

if (VITE_DEV_SERVER_URL) {
  const userDataPath = path.join(process.env.APP_ROOT!, "userData");
  app.setPath("userData", userDataPath);
}

function createWindow() {
  const template: MenuItemConstructorOptions[] = [
    {
      label: "操作",
      submenu: [
        {
          label: "添加分类",
          click: () => {
            win?.webContents.send("show-add-tab");
          },
        },
        {
          label: "修改分类",
          click: () => {
            win?.webContents.send("show-rename-tab");
          },
        },
        {
          label: "删除分类",
          click: () => {
            win?.webContents.send("show-delete-tab");
          },
        },
        {
          label: "排序分类",
          click: () => {
            win?.webContents.send("show-sort-tabs");
          },
        },
        { type: "separator" },
        {
          label: "导出配置",
          click: () => {
            win?.webContents.send("menu-export");
          },
        },
        {
          label: "导入配置",
          click: () => {
            win?.webContents.send("menu-import");
          },
        },
        { type: "separator" },
        {
          label: "清除配置",
          click: () => {
            win?.webContents.send("menu-clear");
          },
        },
      ],
    },
    {
      label: "帮助",
      submenu: [
        {
          label: "关于",
          click: () => {
            win?.webContents.send("show-about");
          },
        },
      ],
    },
  ];

  if (VITE_DEV_SERVER_URL) {
    template.push({
      label: "调试",
      submenu: [
        { role: "toggleDevTools" as const, label: "切换开发者工具" },
        { type: "separator" as const },
        { role: "reload" as const, label: "刷新" },
        { role: "forceReload" as const, label: "强制刷新" },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    width,
    height,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      devTools: !!VITE_DEV_SERVER_URL,
    },
  });

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  win.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win?.hide();
    }
    return false;
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// 单实例检查
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // 当运行第二个实例时
    if (win) {
      if (win.isMinimized()) {
        win.restore();
      }
      win.show();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();
  });
}

// IPC handlers
ipcMain.handle("execute-exe", async (_event, exePath) => {
  return new Promise((resolve, reject) => {
    const workingDirectory = path.dirname(exePath);

    const options = {
      cwd: workingDirectory,
      windowsHide: false,
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/sh",
      windowsVerbatimArguments: true,
      encoding: "utf8" as const,
    };

    try {
      exec(
        `"${exePath}"`,
        options,
        (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            console.error(`执行出错: ${error.message}`);
            if (error.message.includes("EACCES")) {
              reject(
                new Error("没有足够的权限执行此程序，请尝试以管理员身份运行")
              );
            } else {
              reject(error);
            }
            return;
          }

          if (stderr) {
            console.error(`stderr: ${stderr}`);
            reject(new Error(stderr));
            return;
          }

          console.log(`stdout: ${stdout}`);
          resolve({ stdout });
        }
      );
    } catch (err) {
      console.error("执行程序时发生错误:", err);
      reject(err);
    }
  });
});

ipcMain.handle("select-exe", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Executable", extensions: ["exe"] }],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    return {
      filePath,
      fileName: path.basename(filePath, ".exe"),
      size: fileSizeInMB.toFixed(2) + "MB",
    };
  }
  return null;
});

ipcMain.handle("select-icon", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "ico"] }],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    const iconBuffer = fs.readFileSync(filePath);
    const base64Icon = `data:image/${path
      .extname(filePath)
      .slice(1)};base64,${iconBuffer.toString("base64")}`;

    return {
      filePath,
      icon: base64Icon,
    };
  }
  return null;
});

ipcMain.handle("export-config", async (_event, data) => {
  const result = await dialog.showSaveDialog({
    filters: [
      { name: "JSON", extensions: ["json"] },
      { name: "All Files", extensions: ["*"] },
    ],
    defaultPath: "app-config.json",
  });

  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, data);
      return true;
    } catch (error) {
      console.error("写入文件失败:", error);
      throw error;
    }
  }
  return false;
});

ipcMain.handle("import-config", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "JSON", extensions: ["json"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const data = fs.readFileSync(result.filePaths[0], "utf-8");
      JSON.parse(data);
      return data;
    } catch (error) {
      console.error("读取文件失败:", error);
      throw error;
    }
  }
  return null;
});

ipcMain.handle("get-app-version", async () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.env.APP_ROOT, "package.json"), "utf-8")
  );
  return packageJson.version;
});

function getIconStoragePath() {
  if (VITE_DEV_SERVER_URL) {
    return path.join(process.env.APP_ROOT!, "public", "ico");
  } else {
    return path.join(app.getPath("userData"), "ico");
  }
}

function ensureIconDir() {
  const iconDir = getIconStoragePath();
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }
  return iconDir;
}

ipcMain.handle(
  "extract-icon",
  async (_event, exePath: string, outputPath: string): Promise<string> => {
    const iconDir = ensureIconDir();
    const iconFileName = path.basename(outputPath);
    const iconPath = path.join(iconDir, iconFileName);

    return new Promise((resolve, reject) => {
      const escapedExePath = exePath.replace(/'/g, "''");
      const escapedOutputPath = iconPath.replace(/'/g, "''");

      const psScript = `
      Add-Type -AssemblyName System.Drawing
      $exePath = '${escapedExePath}'
      $outputPath = '${escapedOutputPath}'
      
      # 提取图标
      $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exePath)
      
      # 创建目录（如果不存在）
      if (-not (Test-Path -Path (Split-Path $outputPath))) {
        New-Item -ItemType Directory -Path (Split-Path $outputPath) -Force
      }
      
      # 保存图标为PNG格式以保留颜色
      $bitmap = new-object System.Drawing.Bitmap $icon.Width, $icon.Height
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.DrawIcon($icon, 0, 0)
      $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
      $graphics.Dispose()
      $bitmap.Dispose()
      $icon.Dispose()
    `;

      const encodedScript = Buffer.from(psScript, "utf16le").toString("base64");

      exec(
        `powershell -EncodedCommand ${encodedScript}`,
        { windowsHide: true },
        (error) => {
          if (error) {
            console.error("图标提取失败:", error.message);
            reject(new Error(`图标提取失败: ${error.message}`));
            return;
          }

          const iconBuffer = fs.readFileSync(iconPath);
          const base64Icon = `data:image/png;base64,${iconBuffer.toString(
            "base64"
          )}`;
          resolve(base64Icon);
        }
      );
    });
  }
);

function createTray() {
  tray = new Tray(path.join(process.env.VITE_PUBLIC, "favicon.ico"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示主窗口",
      click: () => {
        win?.show();
      },
    },
    {
      label: "退出",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("应用分类管理器");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    win?.show();
  });
}

app.on("before-quit", () => {
  app.isQuitting = true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
    tray = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

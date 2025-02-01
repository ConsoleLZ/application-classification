import { app, BrowserWindow, ipcMain, dialog, Menu, screen } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFile, exec } from "child_process";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  // 创建自定义菜单
  const template = [
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
          label: "删除分类",
          click: () => {
            win?.webContents.send("show-delete-tab");
          },
        },
        { type: 'separator' },
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
        { type: 'separator' },
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

  // 设置应用菜单
  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    width,
    height,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// IPC handler for executing exe files
ipcMain.handle("execute-exe", async (_event, exePath) => {
  return new Promise((resolve, reject) => {
    execFile(exePath, (error: any, stdout: any, stderr: any) => {
      if (error) {
        console.error(`执行出错: ${error.message}`);
        reject(error);
        return;
      }

      if (stderr) {
        console.error(`stderr: ${stderr}`);
        reject(new Error(stderr));
        return;
      }

      console.log(`stdout: ${stdout}`);
      resolve({ stdout });
    });
  });
});

// 添加文件选择处理器
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

// 导出配置
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

// 导入配置
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
      // 验证 JSON 格式
      JSON.parse(data);
      return data;
    } catch (error) {
      console.error("读取文件失败:", error);
      throw error;
    }
  }
  return null;
});

// 添加版本获取处理器
ipcMain.handle("get-app-version", async () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.env.APP_ROOT, "package.json"), "utf-8")
  );
  return packageJson.version;
});

// 添加图标存储路径获取函数
function getIconStoragePath() {
  if (VITE_DEV_SERVER_URL) {
    // 开发环境
    return path.join(process.env.APP_ROOT!, 'public', 'ico');
  } else {
    // 生产环境
    return path.join(app.getPath('userData'), 'ico');
  }
}

// 确保图标存储目录存在
function ensureIconDir() {
  const iconDir = getIconStoragePath();
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }
  return iconDir;
}

// 修改提取图标的处理器
ipcMain.handle("extract-icon", async (_event, exePath: string, outputPath: string): Promise<string> => {
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
      $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exePath)
      $stream = [System.IO.File]::Create($outputPath)
      $icon.Save($stream)
      $stream.Close()
    `;

    const encodedScript = Buffer.from(psScript, 'utf16le').toString('base64');

    exec(`powershell -EncodedCommand ${encodedScript}`, { windowsHide: true }, (error) => {
      if (error) {
        reject(new Error(`图标提取失败: ${error.message}`));
        return;
      }
      // 返回图标的 base64 数据
      const iconBuffer = fs.readFileSync(iconPath);
      const base64Icon = `data:image/x-icon;base64,${iconBuffer.toString('base64')}`;
      resolve(base64Icon);
    });
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

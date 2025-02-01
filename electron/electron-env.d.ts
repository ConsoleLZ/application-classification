/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer & {
    executeExe(exePath: string): Promise<void>
    selectExe(): Promise<{
      filePath: string
      fileName: string
      size: string
    } | null>
    selectIcon(): Promise<{
      filePath: string
      icon: string
    } | null>
    exportConfig(data: string): Promise<boolean>
    importConfig(): Promise<string | null>
    getAppVersion(): Promise<string>
    extractIcon(exePath: string, outputPath: string): Promise<string>
  }
}

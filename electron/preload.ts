import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
  executeExe(exePath: string){
    return ipcRenderer.invoke('execute-exe', exePath)
  },
  selectExe() {
    return ipcRenderer.invoke('select-exe')
  },
  selectIcon() {
    return ipcRenderer.invoke('select-icon')
  },
  getAppInfo(filePath: string) {
    return ipcRenderer.invoke('get-app-info', filePath)
  },
  exportConfig(data: string) {
    return ipcRenderer.invoke('export-config', data)
  },
  importConfig() {
    return ipcRenderer.invoke('import-config')
  },
  getAppVersion() {
    return ipcRenderer.invoke('get-app-version')
  },
  // 提取应用的图标
  extractIcon(exePath: string, outputPath: string) {
    return ipcRenderer.invoke('extract-icon', exePath, outputPath)
  }
  // You can expose other APTs you need here.
  // ...
})

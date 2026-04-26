import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("charByChar", {
  getSettings() {
    return ipcRenderer.invoke("settings:get");
  },
  saveSettings(settings) {
    return ipcRenderer.invoke("settings:save", settings);
  },
  typeClipboardNow() {
    return ipcRenderer.invoke("service:type-now");
  },
  toggleService() {
    return ipcRenderer.invoke("service:toggle");
  }
});

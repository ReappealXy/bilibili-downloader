const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露 IPC 通道给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 选择文件夹
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    
    // 开始下载
    startDownload: (videoUrl, outputDirectory, outputTemplate) => 
        ipcRenderer.invoke('start-download', videoUrl, outputDirectory, outputTemplate),
    
    // 取消下载
    cancelDownload: () => ipcRenderer.invoke('cancel-download'),
    
    // 获取默认配置
    getDefaultConfig: () => ipcRenderer.invoke('get-default-config'),
    
    // 监听下载进度
    onDownloadProgress: (callback) => {
        const subscription = (event, value) => callback(value);
        ipcRenderer.on('download-progress', subscription);
        return () => {
            ipcRenderer.removeListener('download-progress', subscription);
        };
    }
});
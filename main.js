const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let mainWindow;
let ytDlpProcess = null; // 用于存储当前下载进程实例，以便取消

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // 引入预加载脚本
            nodeIntegration: false, // 禁用 Node.js 集成，更安全
            contextIsolation: true, // 启用上下文隔离，更安全
            webSecurity: true // 启用 Web 安全
        }
    });

    mainWindow.loadFile('index.html');

    // 打开开发者工具 (方便调试)
    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
    // 确保在应用关闭时终止任何正在运行的 yt-dlp 进程
    if (ytDlpProcess) {
        ytDlpProcess.kill();
        ytDlpProcess = null;
    }
});

// --- IPC 主进程监听器 ---

// 处理文件选择对话框
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    if (result.canceled) {
        return null;
    }
    return result.filePaths[0];
});

// 默认的下载目录和模板
const DEFAULT_OUTPUT_DIR = path.join(app.getPath('downloads'), 'Bilibili Downloads');
const DEFAULT_OUTPUT_TEMPLATE = "%(playlist_index)02d - %(title)s.%(ext)s";

// 处理下载请求
ipcMain.handle('start-download', async (event, videoUrl, outputDirectory, outputTemplate) => {
    // 使用默认值如果前端没有提供
    const finalOutputDir = outputDirectory || DEFAULT_OUTPUT_DIR;
    const finalOutputTemplate = outputTemplate || DEFAULT_OUTPUT_TEMPLATE;

    // 确保输出目录存在
    if (!fs.existsSync(finalOutputDir)) {
        try {
            fs.mkdirSync(finalOutputDir, { recursive: true });
            mainWindow.webContents.send('download-progress', `已创建下载目录: ${finalOutputDir}\n`);
        } catch (err) {
            mainWindow.webContents.send('download-progress', `错误: 无法创建目录 ${finalOutputDir}: ${err.message}\n`);
            return { success: false, message: `无法创建目录: ${err.message}` };
        }
    } else {
        mainWindow.webContents.send('download-progress', `下载目录已存在: ${finalOutputDir}\n`);
    }

    const fullOutputPath = path.join(finalOutputDir, finalOutputTemplate);

    const args = [
        "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--merge-output-format", "mp4",
        "-o", fullOutputPath,
        videoUrl
    ];

    mainWindow.webContents.send('download-progress', `\n--- 开始下载Bilibili视频系列 ---\n`);
    mainWindow.webContents.send('download-progress', `目标URL: ${videoUrl}\n`);
    mainWindow.webContents.send('download-progress', `视频将保存到: ${path.resolve(finalOutputDir)}\n`);
    mainWindow.webContents.send('download-progress', `命名格式: ${finalOutputTemplate}\n`);
    mainWindow.webContents.send('download-progress', `执行命令: yt-dlp ${args.join(' ')}\n`);
    mainWindow.webContents.send('download-progress', "-".repeat(60) + "\n");

    try {
        ytDlpProcess = spawn('yt-dlp', args);

        ytDlpProcess.stdout.on('data', (data) => {
            mainWindow.webContents.send('download-progress', data.toString());
        });

        ytDlpProcess.stderr.on('data', (data) => {
            // yt-dlp 常用输出在 stderr，例如警告和进度条
            mainWindow.webContents.send('download-progress', data.toString());
        });

        return new Promise((resolve) => {
            ytDlpProcess.on('close', (code) => {
                ytDlpProcess = null; // 清除进程引用
                if (code === 0) {
                    mainWindow.webContents.send('download-progress', "-".repeat(60) + "\n");
                    mainWindow.webContents.send('download-progress', "所有视频下载并命名成功！\n");
                    resolve({ success: true, message: '下载完成' });
                } else {
                    mainWindow.webContents.send('download-progress', `\n错误: yt-dlp 下载失败，退出代码 ${code}\n`);
                    mainWindow.webContents.send('download-progress', "请检查网络连接、URL是否有效，或尝试更新 yt-dlp (yt-dlp -U)。\n");
                    resolve({ success: false, message: `yt-dlp exited with code ${code}` });
                }
            });

            ytDlpProcess.on('error', (err) => {
                ytDlpProcess = null; // 清除进程引用
                if (err.code === 'ENOENT') {
                    mainWindow.webContents.send('download-progress', "\n错误: 找不到 'yt-dlp' 命令。\n");
                    mainWindow.webContents.send('download-progress', "请确保 'yt-dlp' 已正确安装并已添加到系统环境变量 (PATH) 中。\n");
                    mainWindow.webContents.send('download-progress', "或者将 yt-dlp.exe (Windows) 放在与此Node.js脚本相同的目录下。\n");
                    resolve({ success: false, message: `yt-dlp not found: ${err.message}` });
                } else {
                    mainWindow.webContents.send('download-progress', `\n发生未知错误: ${err.message}\n`);
                    resolve({ success: false, message: `未知错误: ${err.message}` });
                }
            });
        });

    } catch (error) {
        ytDlpProcess = null;
        mainWindow.webContents.send('download-progress', `下载过程中发生异常: ${error.message}\n`);
        return { success: false, message: `异常: ${error.message}` };
    }
});

// 处理取消下载请求
ipcMain.handle('cancel-download', async () => {
    if (ytDlpProcess) {
        try {
            ytDlpProcess.kill(); // 终止进程
            ytDlpProcess = null; // 清除引用
            mainWindow.webContents.send('download-progress', "\n下载已取消。\n");
            return { success: true, message: '下载已取消' };
        } catch (error) {
            mainWindow.webContents.send('download-progress', `取消下载时发生错误: ${error.message}\n`);
            return { success: false, message: `取消下载时发生错误: ${error.message}` };
        }
    } else {
        mainWindow.webContents.send('download-progress', "\n没有正在进行的下载可以取消。\n");
        return { success: false, message: '没有正在进行的下载' };
    }
});

// 暴露默认路径和模板给渲染进程
ipcMain.handle('get-default-config', () => {
    return {
        defaultOutputDir: DEFAULT_OUTPUT_DIR,
        defaultOutputTemplate: DEFAULT_OUTPUT_TEMPLATE
    };
});
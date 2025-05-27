// 在页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const videoUrlInput = document.getElementById('videoUrl');
    const outputDirDisplay = document.getElementById('outputDirDisplay');
    const outputTemplateInput = document.getElementById('outputTemplate');
    const selectFolderBtn = document.getElementById('selectFolderBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const downloadOutput = document.getElementById('downloadOutput');
    const progressBar = document.getElementById('progressBar');
    const completedDownloadsList = document.getElementById('completedDownloads');

    // 存储当前选择的输出目录
    let selectedOutputDir = null;
    let isDownloading = false;

    // 获取默认配置
    window.electronAPI.getDefaultConfig().then(config => {
        selectedOutputDir = config.defaultOutputDir;
        outputDirDisplay.textContent = selectedOutputDir;
        outputTemplateInput.value = config.defaultOutputTemplate;
    });

    // 选择文件夹按钮点击事件
    selectFolderBtn.addEventListener('click', async () => {
        const result = await window.electronAPI.selectFolder();
        if (result) {
            selectedOutputDir = result;
            outputDirDisplay.textContent = selectedOutputDir;
        }
    });

    // 开始下载按钮点击事件
    downloadBtn.addEventListener('click', async () => {
        const videoUrl = videoUrlInput.value.trim();
        if (!videoUrl) {
            alert('请输入有效的Bilibili视频URL');
            return;
        }

        // 清空之前的输出
        downloadOutput.textContent = '';
        progressBar.style.width = '0%';

        // 更新UI状态
        isDownloading = true;
        downloadBtn.disabled = true;
        cancelBtn.disabled = false;
        videoUrlInput.disabled = true;
        outputTemplateInput.disabled = true;
        selectFolderBtn.disabled = true;

        // 开始下载
        try {
            const result = await window.electronAPI.startDownload(
                videoUrl, 
                selectedOutputDir, 
                outputTemplateInput.value
            );

            // 下载完成后更新UI
            isDownloading = false;
            downloadBtn.disabled = false;
            cancelBtn.disabled = true;
            videoUrlInput.disabled = false;
            outputTemplateInput.disabled = false;
            selectFolderBtn.disabled = false;

            // 如果下载成功，添加到已完成列表
            if (result.success) {
                addCompletedDownload(videoUrl, selectedOutputDir);
            }
        } catch (error) {
            console.error('下载过程中发生错误:', error);
            downloadOutput.textContent += `\n下载过程中发生错误: ${error.message}\n`;
            
            // 错误后恢复UI
            isDownloading = false;
            downloadBtn.disabled = false;
            cancelBtn.disabled = true;
            videoUrlInput.disabled = false;
            outputTemplateInput.disabled = false;
            selectFolderBtn.disabled = false;
        }
    });

    // 取消下载按钮点击事件
    cancelBtn.addEventListener('click', async () => {
        if (isDownloading) {
            await window.electronAPI.cancelDownload();
            
            // 恢复UI状态
            isDownloading = false;
            downloadBtn.disabled = false;
            cancelBtn.disabled = true;
            videoUrlInput.disabled = false;
            outputTemplateInput.disabled = false;
            selectFolderBtn.disabled = false;
        }
    });

    // 监听下载进度
    const removeProgressListener = window.electronAPI.onDownloadProgress((message) => {
        // 追加消息到输出区域
        downloadOutput.textContent += message;
        // 自动滚动到底部
        downloadOutput.scrollTop = downloadOutput.scrollHeight;

        // 尝试从输出中提取下载进度
        updateProgressFromOutput(message);
    });

    // 从输出文本中提取并更新进度条
    function updateProgressFromOutput(text) {
        // 尝试匹配yt-dlp进度信息 (例如 [download] 25.5% of ~50.00MiB)
        const progressMatch = text.match(/\[download\]\s+(\d+\.?\d*)%/);
        if (progressMatch && progressMatch[1]) {
            const percentage = parseFloat(progressMatch[1]);
            if (!isNaN(percentage)) {
                progressBar.style.width = `${percentage}%`;
            }
        }
    }

    // 添加已完成的下载到列表
    function addCompletedDownload(url, outputDir) {
        const now = new Date();
        const timeString = now.toLocaleString();
        
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div class="completed-item">
                <div class="completed-info">
                    <strong>URL:</strong> ${url}<br>
                    <strong>保存位置:</strong> ${outputDir}<br>
                    <strong>完成时间:</strong> ${timeString}
                </div>
            </div>
        `;
        
        completedDownloadsList.appendChild(listItem);
    }

    // 页面卸载前清理事件监听器
    window.addEventListener('beforeunload', () => {
        if (removeProgressListener) {
            removeProgressListener();
        }
    });
});
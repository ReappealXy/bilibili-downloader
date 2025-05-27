# Bilibili视频系列下载器 📺

一个基于Electron和JavaScript的B站视频下载工具，可以方便地下载Bilibili上的视频系列。

## ✨ 功能特点

- 📱 简洁易用的图形界面
- 📂 支持下载Bilibili视频系列/合集/单个视频
- 🔧 自定义下载目录和文件命名格式
- 📊 实时显示下载进度
- 🛑 支持取消正在进行的下载
- 📝 记录已完成的下载历史

## 📥 安装方法

### 方法一：直接下载可执行文件

1. 从[Releases页面](https://github.com/ReappealXy/bilibili-downloader/releases)下载最新版本的可执行文件
2. 解压下载的文件
3. 运行`bilibili-downloader.exe`

### 方法二：从源码构建

1. 克隆仓库
   ```bash
   git clone https://github.com/ReappealXy/bilibili-downloader.git
   cd bilibili-downloader
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 下载必要的二进制文件
   - 下载 [ffmpeg.exe](https://www.gyan.dev/ffmpeg/builds/)
   - 下载 [ffprobe.exe](https://www.gyan.dev/ffmpeg/builds/)
   - 下载 [yt-dlp.exe](https://github.com/yt-dlp/yt-dlp/releases)
   - **将这些文件放在项目根目录下（与index.html同级目录）**

4. 启动应用
   ```bash
   npm start
   ```

5. （可选）构建可执行文件
   ```bash
   npm install -g electron-packager
   electron-packager . bilibili-downloader --platform=win32 --arch=x64
   ```

## 🚀 使用方法

1. 启动应用程序
2. 在输入框中粘贴Bilibili视频URL（支持视频系列/合集/单个视频）
3. 选择下载目录（默认为用户下载文件夹下的`Bilibili Downloads`）
4. 设置文件命名模板（默认为`%(playlist_index)02d - %(title)s.%(ext)s`）
5. 点击"开始下载"按钮
6. 等待下载完成

## ⚠️ 重要提示

### 关闭代理（VPN）下载

**强烈建议在下载视频时关闭任何代理或VPN服务**，原因如下：

- 使用代理可能导致下载速度变慢
- 某些代理服务可能会限制大文件下载
- 可能导致下载中断或失败
- B站对某些国外IP地址有访问限制

### 其他注意事项

- 请确保有足够的磁盘空间用于下载视频
- 下载高清视频需要较好的网络连接
- 尊重创作者版权，下载的视频仅供个人学习使用
- 如遇到下载失败，可尝试更新yt-dlp（点击"更新yt-dlp"按钮）

## 📋 文件命名模板说明

默认的文件命名模板为`%(playlist_index)02d - %(title)s.%(ext)s`，表示：

- `%(playlist_index)02d`：视频在播放列表中的序号（两位数字，不足补0）
- `%(title)s`：视频标题
- `%(ext)s`：视频文件扩展名

其他可用的格式化选项：

- `%(uploader)s`：上传者名称
- `%(upload_date)s`：上传日期（YYYYMMDD格式）
- `%(duration)s`：视频时长（秒）
- `%(id)s`：视频ID

## 🔧 技术实现

- 前端：Electron、HTML、CSS、JavaScript
- 视频下载：yt-dlp
- 视频处理：ffmpeg

## 📄 许可证

[MIT](LICENSE)

## 🙏 致谢

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - 强大的视频下载工具
- [ffmpeg](https://ffmpeg.org/) - 视频处理工具
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用开发框架
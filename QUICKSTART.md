# 快速入门 - 3分钟启动你的密码备忘录

## 第一步：安装依赖（2分钟）

在项目目录下运行：

```bash
npm install
```

## 第二步：启动应用（1分钟）

### 方式A：一键启动（推荐）

```bash
./start.sh
```

### 方式B：手动启动

```bash
npm start
```

## 第三步：在手机上查看

### Android 手机：

1. 在 Google Play 搜索并安装 **Expo Go**
2. 打开 Expo Go，点击 "Scan QR code"
3. 扫描终端显示的二维码
4. 等待几秒，应用就会出现在你的手机上！

### 使用模拟器（如果已安装）：

```bash
npm run android
```

## 完成！🎉

现在你可以：
- ➕ 点击右下角按钮添加密码
- 🔍 使用搜索栏快速查找
- 🌓 点击右上角切换深色/浅色主题
- ✏️ 点击铅笔图标编辑
- 🗑️ 点击删除图标删除

## 遇到问题？

### 问题1：npm install 失败
```bash
# 清除缓存重试
npm cache clean --force
npm install
```

### 问题2：手机连接不上
- 确保手机和电脑在同一个 WiFi 网络
- 尝试使用隧道模式：`npm start -- --tunnel`

### 问题3：Expo Go 扫码后无反应
- 更新 Expo Go 到最新版本
- 重启开发服务器：按 Ctrl+C 停止，然后重新运行 `npm start`

## 下一步

- 📖 查看 [README.md](README.md) 了解完整功能
- 🛠️ 查看 [DEVELOPMENT.md](DEVELOPMENT.md) 学习如何自定义开发
- 📦 准备发布？运行 `eas build --platform android --profile preview` 构建 APK

---

**提示**: 第一次启动可能需要下载一些依赖，请耐心等待。之后的启动会很快！

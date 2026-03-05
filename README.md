# 密码备忘录 PassNote

一个简洁、安全、美观的安卓密码管理应用。

## 技术选型说明

### 核心技术栈

1. **React Native + Expo**
   - ✅ 快速开发，热重载体验极佳
   - ✅ 跨平台支持（可轻松扩展到iOS）
   - ✅ Expo提供完整的开发工具链
   - ✅ 无需配置Android Studio即可开发预览

2. **React Native Paper (Material Design 3)**
   - ✅ 遵循Google Material Design 3设计规范
   - ✅ 组件丰富且美观现代
   - ✅ 支持深色/浅色主题切换
   - ✅ 开箱即用的动画效果

3. **Expo SecureStore**
   - ✅ 加密存储敏感数据
   - ✅ 使用系统级加密（Android Keystore）
   - ✅ 简单易用的API

4. **Expo Crypto**
   - ✅ 生成安全的UUID
   - ✅ 原生性能

## 功能特性

- 🔐 安全加密存储密码
- 🎨 Material Design 3 美观界面
- 🌓 深色/浅色主题切换
- 🔍 快速搜索功能
- 🏷️ 分类管理（社交、邮箱、银行、工作、购物、其他）
- ✏️ 添加、编辑、删除密码记录
- 📝 支持备注信息
- 📱 响应式设计

## 开发环境要求

- Node.js 18+
- npm 或 yarn
- 手机安装 Expo Go 应用（用于预览）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

或使用 yarn:

```bash
yarn install
```

### 2. 启动开发服务器

```bash
npm start
```

或:

```bash
npx expo start
```

### 3. 在手机上预览

1. 在手机上安装 **Expo Go** 应用
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. 扫描终端显示的二维码

3. 应用会自动加载到手机上

### 4. 使用Android模拟器（可选）

如果你已安装Android Studio和模拟器：

```bash
npm run android
```

## 构建安装包

### 构建APK（Android）

1. 安装 EAS CLI:

```bash
npm install -g eas-cli
```

2. 登录 Expo 账号:

```bash
eas login
```

3. 配置构建:

```bash
eas build:configure
```

4. 构建APK:

```bash
eas build --platform android --profile preview
```

构建完成后会得到一个APK文件，可直接安装到Android设备。

### 本地构建（无需Expo账号）

如果想本地构建，需要配置Android开发环境：

1. 安装 Android Studio
2. 配置环境变量
3. 运行:

```bash
npx expo run:android
```

## 项目结构

```
passnote/
├── App.js              # 主应用文件
├── app.json            # Expo配置
├── package.json        # 依赖配置
├── assets/             # 图标和启动画面（需创建）
└── README.md           # 本文件
```

## 使用说明

1. **添加密码**: 点击右下角的 ➕ 按钮
2. **搜索**: 使用顶部搜索栏快速查找
3. **编辑**: 点击卡片上的铅笔图标
4. **删除**: 点击卡片上的删除图标
5. **切换主题**: 点击右上角的太阳/月亮图标

## 数据安全

- 所有密码使用 Expo SecureStore 加密存储
- 数据仅保存在本地设备
- 使用系统级加密（Android Keystore）
- 不会上传到任何服务器

## 开发调试

### 查看日志

```bash
npx expo start
# 按 j 打开调试器
```

### 清除缓存

```bash
npx expo start -c
```

### 重置项目

```bash
rm -rf node_modules
npm install
```

## 常见问题

**Q: 如何在真机上安装？**
A: 使用 Expo Go 扫码预览，或构建APK后传输到手机安装。

**Q: 数据会丢失吗？**
A: 数据存储在设备本地，卸载应用会清除数据，建议定期导出备份（后续版本可添加）。

**Q: 支持指纹解锁吗？**
A: 当前版本未实现，可在后续版本添加 expo-local-authentication。

**Q: 如何修改主题颜色？**
A: 编辑 App.js 中的 lightTheme 和 darkTheme 配置。

## 后续开发建议

- [ ] 添加生物识别解锁（指纹/面容）
- [ ] 密码强度检测
- [ ] 密码生成器
- [ ] 数据导出/导入功能
- [ ] 云端备份（可选）
- [ ] 密码过期提醒
- [ ] 更多分类自定义

## 技术支持

如遇问题，请检查：
1. Node.js 版本是否 >= 18
2. 依赖是否正确安装
3. Expo Go 是否为最新版本
4. 手机和电脑是否在同一网络

## 许可证

MIT License

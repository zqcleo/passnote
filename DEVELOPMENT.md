# 开发指南

## 快速开始

### 方式一：使用启动脚本（推荐）

```bash
./start.sh
```

### 方式二：手动启动

```bash
npm install
npm start
```

## 开发流程

### 1. 安装依赖（首次运行）

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm start
```

终端会显示二维码和开发菜单。

### 3. 在手机上预览

**Android:**
1. 在 Google Play 下载 **Expo Go**
2. 打开 Expo Go，点击 "Scan QR code"
3. 扫描终端显示的二维码
4. 应用会自动加载

**使用模拟器:**
```bash
npm run android  # Android 模拟器
npm run ios      # iOS 模拟器（仅 macOS）
```

## 代码结构

### App.js 主要组件

```
App (根组件)
└── MainApp (主应用)
    ├── Appbar (顶部栏)
    ├── Searchbar (搜索栏)
    ├── ScrollView (密码列表)
    │   └── Card (密码卡片)
    ├── Modal (添加/编辑弹窗)
    └── FAB (浮动按钮)
```

### 数据流

1. **加载**: `loadPasswords()` 从 SecureStore 读取
2. **保存**: `savePasswords()` 写入 SecureStore
3. **状态**: 使用 React Hooks (useState)

### 关键功能实现

**加密存储:**
```javascript
import * as SecureStore from 'expo-secure-store';

// 保存
await SecureStore.setItemAsync('passwords', JSON.stringify(data));

// 读取
const data = await SecureStore.getItemAsync('passwords');
```

**UUID生成:**
```javascript
import * as Crypto from 'expo-crypto';

const id = await Crypto.randomUUID();
```

## 自定义开发

### 修改主题颜色

编辑 `App.js` 中的主题配置：

```javascript
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',      // 主色调
    secondary: '#03dac6',    // 次要色
  },
};
```

### 添加新分类

修改 `categories` 数组：

```javascript
const categories = ['社交', '邮箱', '银行', '工作', '购物', '游戏', '其他'];
```

### 添加新字段

1. 在 `formData` 中添加字段
2. 在 Modal 中添加 TextInput
3. 在 Card 中显示新字段

## 调试技巧

### 查看控制台日志

开发服务器运行时，按 `j` 打开 Chrome DevTools。

### 重新加载应用

- 在 Expo Go 中摇晃手机
- 或在终端按 `r`

### 清除缓存

```bash
npm start -- --clear
```

### 查看错误

错误会显示在：
1. Expo Go 应用中（红屏）
2. 终端输出
3. Chrome DevTools 控制台

## 构建发布

### 开发版APK（测试用）

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 登录
eas login

# 配置
eas build:configure

# 构建
eas build --platform android --profile preview
```

### 生产版APK（发布用）

```bash
eas build --platform android --profile production
```

### 发布到 Google Play

1. 构建生产版 AAB:
```bash
eas build --platform android --profile production
```

2. 在 Google Play Console 上传 AAB

3. 填写应用信息并提交审核

## 性能优化

### 减少重渲染

使用 `React.memo` 包装组件：

```javascript
const PasswordCard = React.memo(({ item, onEdit, onDelete }) => {
  // ...
});
```

### 虚拟列表

如果密码数量很多，使用 FlatList 替代 ScrollView：

```javascript
<FlatList
  data={filteredPasswords}
  renderItem={({ item }) => <PasswordCard item={item} />}
  keyExtractor={item => item.id}
/>
```

## 常用命令

```bash
npm start              # 启动开发服务器
npm run android        # 在 Android 模拟器运行
npm run ios            # 在 iOS 模拟器运行
npm install            # 安装依赖
npm start -- --clear   # 清除缓存启动
```

## 故障排除

### 端口被占用

```bash
# 杀死占用端口的进程
lsof -ti:8081 | xargs kill -9
```

### 依赖问题

```bash
rm -rf node_modules package-lock.json
npm install
```

### Expo Go 连接失败

1. 确保手机和电脑在同一 WiFi
2. 检查防火墙设置
3. 尝试使用隧道模式: `npm start -- --tunnel`

## 扩展功能建议

### 1. 生物识别解锁

```bash
npx expo install expo-local-authentication
```

### 2. 密码生成器

```javascript
function generatePassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(x => chars[x % chars.length])
    .join('');
}
```

### 3. 数据导出

```javascript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

async function exportData() {
  const data = JSON.stringify(passwords, null, 2);
  const fileUri = FileSystem.documentDirectory + 'passwords_backup.json';
  await FileSystem.writeAsStringAsync(fileUri, data);
  await Sharing.shareAsync(fileUri);
}
```

## 资源链接

- [Expo 文档](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Native 文档](https://reactnative.dev/)
- [Material Design 3](https://m3.material.io/)

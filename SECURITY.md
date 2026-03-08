# 安全问题记录

## 已修复

| # | 问题 | 修复方式 |
|---|------|----------|
| 1 | 手势密码存储在 AsyncStorage（明文） | 改用 `SecureStore.setItemAsync/getItemAsync` |
| 4 | 认证配置读取失败时默认解锁 | 去掉 catch 块中的 `setIsLocked(false)`，异常时保持锁定 |

---

## 待修复

### 🔴 高危

**#2 剪贴板永久留存**
- 位置：`App.js` `copyToClipboard`
- 问题：`Clipboard.setString(text)` 后从不清除，其他 App 可读取
- 方案：复制后 30–60 秒自动调用 `Clipboard.setString('')` 清空

**#3 Web 平台密码明文存储**
- 位置：`App.js` `loadPasswords` / `savePasswords`
- 问题：Web 端使用 `AsyncStorage`（即 `localStorage`），浏览器开发者工具可直接查看所有密码，且跳过了锁屏验证
- 方案：禁用 Web 平台支持，或在 Web 端显示明确的安全风险提示

### 🟠 中危

**#5 手势密码无暴力破解防护**
- 位置：`GesturePassword.js` `handlePatternComplete`
- 问题：错误次数无限制，无延迟，9 个点连 4 个约 3000 种组合，可快速穷举
- 方案：连续错误 5 次后锁定 30 秒，错误次数持久化防重启绕过

**#6 无会话超时**
- 位置：`App.js`
- 问题：解锁后永不重新锁定，手机被他人拿到后可直接访问所有密码
- 方案：监听 `AppState`，App 进入后台超过 N 分钟后将 `isLocked` 重置为 `true`

### 🟡 低危

**#7 密码明文存在 React State**
- 位置：`App.js` `openModal`
- 问题：`setFormData(password)` 将完整密码对象存入 React state，开发模式下 DevTools 可见
- 方案：编辑完成或取消后立即清除 `formData` 中的敏感字段

**#8 错误日志包含上下文信息**
- 位置：`App.js` 多处 `console.error`
- 问题：生产环境接入日志服务时，错误堆栈可能携带存储路径、数据片段等敏感上下文
- 方案：生产环境禁用或脱敏 `console.error` 输出

**#9 存储数据无格式校验**
- 位置：`App.js` `loadPasswords`
- 问题：`JSON.parse(stored)` 直接反序列化，root 设备上数据被篡改可导致崩溃或异常行为
- 方案：反序列化后校验数据结构，过滤非法字段

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Platform, Clipboard, Keyboard } from 'react-native';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme, Appbar, FAB, Portal, Modal, TextInput, Button, Card, Text, IconButton, Searchbar, Chip, useTheme, Snackbar, Switch, Divider, TouchableRipple } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GesturePassword from './GesturePassword';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#bb86fc',
    secondary: '#03dac6',
  },
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [hasGesturePassword, setHasGesturePassword] = useState(false);
  const [gesturePattern, setGesturePattern] = useState(null);
  const [showGestureSetup, setShowGestureSetup] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [gestureEnabled, setGestureEnabled] = useState(true);
  const [showGestureModal, setShowGestureModal] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    checkAuthSettings();
  }, []);

  const checkAuthSettings = async () => {
    if (Platform.OS === 'web') {
      setIsLocked(false);
      return;
    }

    try {
      // 读取开关设置，默认均为开启
      const biometricSetting = await AsyncStorage.getItem('biometricEnabled');
      const gestureSetting = await AsyncStorage.getItem('gestureEnabled');
      const biometricOn = biometricSetting !== 'false';
      const gestureOn = gestureSetting !== 'false';
      setBiometricEnabled(biometricOn);
      setGestureEnabled(gestureOn);

      // 读取手势密码（存储在 SecureStore，加密保护）
      const storedPattern = await SecureStore.getItemAsync('gesturePattern');
      if (storedPattern) {
        setHasGesturePassword(true);
        setGesturePattern(JSON.parse(storedPattern));
      }

      // 两者均关闭时直接解锁
      if (!biometricOn && !gestureOn) {
        setIsLocked(false);
        return;
      }

      // 手势开启但未设置过密码，进入首次设置流程
      if (gestureOn && !storedPattern) {
        setShowGestureSetup(true);
      }
    } catch (error) {
      // 读取配置失败时保持锁定状态，不因异常而自动解锁
      // 生物识别默认开启，用户仍可通过生物识别解锁
      console.error('检查认证设置失败:', error);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: '验证身份以访问密码',
        fallbackLabel: '使用手势密码',
        cancelLabel: '取消',
      });

      return result.success;
    } catch (error) {
      console.error('生物识别失败:', error);
      return false;
    }
  };

  const handleGestureSetup = async (pattern) => {
    try {
      await SecureStore.setItemAsync('gesturePattern', JSON.stringify(pattern));
      setGesturePattern(pattern);
      setHasGesturePassword(true);
      setShowGestureSetup(false);
      setIsLocked(false);
      Alert.alert('成功', '手势密码设置成功');
    } catch (error) {
      Alert.alert('错误', '手势密码设置失败');
    }
  };

  const handleGestureUnlock = () => {
    setIsLocked(false);
  };

  const handleUnlock = async () => {
    if (Platform.OS === 'web') {
      setIsLocked(false);
      return;
    }

    const biometricSuccess = await handleBiometricAuth();
    if (biometricSuccess) {
      setIsLocked(false);
    }
  };

  const handleToggleBiometric = async (value) => {
    setBiometricEnabled(value);
    await AsyncStorage.setItem('biometricEnabled', String(value));
  };

  const handleToggleGesture = async (value) => {
    setGestureEnabled(value);
    await AsyncStorage.setItem('gestureEnabled', String(value));
    // 开启手势且未设置过密码，引导首次设置
    if (value && !hasGesturePassword) {
      setShowGestureSetup(true);
    }
  };

  const handleGesturePatternSaved = (pattern) => {
    setGesturePattern(pattern);
    setHasGesturePassword(true);
  };

  if (Platform.OS !== 'web' && showGestureSetup) {
    return (
      <PaperProvider theme={theme}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <GesturePassword
          isSetup={true}
          onSetup={handleGestureSetup}
        />
      </PaperProvider>
    );
  }

  if (Platform.OS !== 'web' && isLocked) {
    const showGesture = gestureEnabled && hasGesturePassword;
    const showBiometric = biometricEnabled;

    return (
      <PaperProvider theme={theme}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <View style={[styles.lockScreen, { backgroundColor: theme.colors.background }]}>
          <View style={styles.lockCenter}>
            <Text variant="headlineLarge" style={styles.lockTitle}>
              密码备忘录
            </Text>
            <Text variant="bodyLarge" style={styles.lockSubtitle}>
              请验证身份以继续
            </Text>
            {showBiometric && (
              <Button
                mode="contained"
                onPress={handleUnlock}
                style={styles.unlockButton}
                icon="fingerprint"
              >
                使用生物识别解锁
              </Button>
            )}
            {showGesture && (
              <Button
                mode={showBiometric ? 'outlined' : 'contained'}
                onPress={() => setShowGestureModal(true)}
                style={[styles.unlockButton, showBiometric && { marginTop: 12 }]}
                icon="gesture"
              >
                使用手势密码解锁
              </Button>
            )}
          </View>
        </View>

        {/* 手势解锁弹窗 */}
        <Portal>
          <Modal
            visible={showGestureModal}
            onDismiss={() => setShowGestureModal(false)}
            contentContainerStyle={[styles.gestureModal, { backgroundColor: theme.colors.background }]}
          >
            <GesturePassword
              isSetup={false}
              storedPattern={gesturePattern}
              onSuccess={() => {
                setShowGestureModal(false);
                handleGestureUnlock();
              }}
            />
            <Button
              mode="text"
              onPress={() => setShowGestureModal(false)}
              style={{ marginBottom: 16 }}
            >
              取消
            </Button>
          </Modal>
        </Portal>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <MainApp
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        biometricEnabled={biometricEnabled}
        gestureEnabled={gestureEnabled}
        hasGesturePassword={hasGesturePassword}
        onToggleBiometric={handleToggleBiometric}
        onToggleGesture={handleToggleGesture}
        onGesturePatternSaved={handleGesturePatternSaved}
      />
    </PaperProvider>
  );
}

function MainApp({ isDarkMode, setIsDarkMode, biometricEnabled, gestureEnabled, hasGesturePassword, onToggleBiometric, onToggleGesture, onGesturePatternSaved }) {
  const theme = useTheme();
  const [passwords, setPasswords] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [showPasswordInForm, setShowPasswordInForm] = useState(true);
  const [errors, setErrors] = useState({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [resetGestureVisible, setResetGestureVisible] = useState(false);
  const [manageCategoriesVisible, setManageCategoriesVisible] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#607D8B');
  const [editingCat, setEditingCat] = useState(null); // { name, value }
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null); // null = 全部
  const [categories, setCategories] = useState([
    { name: '社交', color: '#4CAF50' },
    { name: '邮箱', color: '#2196F3' },
    { name: '银行', color: '#FF9800' },
    { name: '工作', color: '#9C27B0' },
    { name: '购物', color: '#F44336' },
    { name: '其他', color: '#607D8B' },
  ]);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    website: '',
    notes: '',
    category: '其他',
  });

  useEffect(() => {
    loadPasswords();
    loadCategories();
    const showSub = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const COLOR_PALETTE = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7',
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFC107', '#FF9800', '#FF5722', '#607D8B',
  ];

  const getCategoryColor = (name) => {
    const cat = categories.find(c => c.name === name);
    return cat ? cat.color : '#607D8B';
  };

  const loadCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem('categories');
      if (stored) {
        setCategories(JSON.parse(stored));
      }
    } catch (error) {
      console.error('加载标签失败:', error);
    }
  };

  const saveCategories = async (newCategories) => {
    try {
      await AsyncStorage.setItem('categories', JSON.stringify(newCategories));
      setCategories(newCategories);
    } catch (error) {
      Alert.alert('错误', '保存标签失败');
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryInput.trim();
    if (!name) return;
    if (categories.some(c => c.name === name)) {
      Alert.alert('提示', '该标签已存在');
      return;
    }
    await saveCategories([...categories, { name, color: newCategoryColor }]);
    setNewCategoryInput('');
    setNewCategoryColor('#607D8B');
  };

  const handleRenameCategoryConfirm = async () => {
    if (!editingCat) return;
    const newName = editingCat.value.trim();
    if (!newName) { setEditingCat(null); return; }
    if (newName !== editingCat.name && categories.some(c => c.name === newName)) {
      Alert.alert('提示', '该标签名已存在');
      return;
    }
    const newCategories = categories.map(c =>
      c.name === editingCat.name ? { ...c, name: newName } : c
    );
    await saveCategories(newCategories);
    if (formData.category === editingCat.name) {
      setFormData(prev => ({ ...prev, category: newName }));
    }
    setEditingCat(null);
  };

  const handleDeleteCategory = (cat) => {
    if (categories.length <= 1) {
      Alert.alert('提示', '至少保留一个标签');
      return;
    }
    Alert.alert('删除标签', `确定删除「${cat.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          const newCategories = categories.filter(c => c.name !== cat.name);
          await saveCategories(newCategories);
          if (formData.category === cat.name) {
            setFormData(prev => ({ ...prev, category: newCategories[0].name }));
          }
        },
      },
    ]);
  };

  const loadPasswords = async () => {
    try {
      let stored;
      if (Platform.OS === 'web') {
        stored = await AsyncStorage.getItem('passwords');
      } else {
        stored = await SecureStore.getItemAsync('passwords');
      }
      if (stored) {
        setPasswords(JSON.parse(stored));
      }
    } catch (error) {
      console.error('加载失败:', error);
    }
  };

  const savePasswords = async (newPasswords) => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem('passwords', JSON.stringify(newPasswords));
      } else {
        await SecureStore.setItemAsync('passwords', JSON.stringify(newPasswords));
      }
      setPasswords(newPasswords);
    } catch (error) {
      Alert.alert('错误', '保存失败');
      console.error('保存失败:', error);
    }
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!formData.website) newErrors.website = true;
    if (!formData.username) newErrors.username = true;
    if (!formData.password) newErrors.password = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const newPassword = {
      id: editingId || await Crypto.randomUUID(),
      ...formData,
      createdAt: editingId ? passwords.find(p => p.id === editingId)?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let newPasswords;
    if (editingId) {
      newPasswords = passwords.map(p => p.id === editingId ? newPassword : p);
    } else {
      newPasswords = [newPassword, ...passwords];
    }

    await savePasswords(newPasswords);
    closeModal();
  };

  const handleDelete = (id) => {
    Alert.alert(
      '确认删除',
      '确定要删除这条记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const newPasswords = passwords.filter(p => p.id !== id);
            await savePasswords(newPasswords);
          },
        },
      ]
    );
  };

  const openModal = (password = null) => {
    if (password) {
      setEditingId(password.id);
      setFormData(password);
    } else {
      setEditingId(null);
      setFormData({
        username: '',
        password: '',
        website: '',
        notes: '',
        category: categories.some(c => c.name === '其他') ? '其他' : categories[0]?.name,
      });
    }
    setVisible(true);
  };

  const closeModal = () => {
    setVisible(false);
    setEditingId(null);
    setShowPasswordInForm(true);
    setErrors({});
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    setSnackbarMessage(`${label}已复制到剪贴板`);
    setSnackbarVisible(true);
  };

  const handleResetGesture = async (newPattern) => {
    try {
      await SecureStore.setItemAsync('gesturePattern', JSON.stringify(newPattern));
      onGesturePatternSaved(newPattern);
      setResetGestureVisible(false);
      setSnackbarMessage('手势密码重置成功');
      setSnackbarVisible(true);
    } catch (error) {
      Alert.alert('错误', '手势密码重置失败');
    }
  };

  const filteredPasswords = passwords.filter(p => {
    const matchSearch =
      p.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = !selectedCategory || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="密码备忘录" />
        <Appbar.Action
          icon={isDarkMode ? 'white-balance-sunny' : 'moon-waning-crescent'}
          onPress={() => setIsDarkMode(!isDarkMode)}
        />
        {Platform.OS !== 'web' && (
          <Appbar.Action
            icon="cog"
            onPress={() => setSettingsVisible(true)}
          />
        )}
      </Appbar.Header>

      <Searchbar
        placeholder="搜索..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
        keyboardShouldPersistTaps="handled"
      >
        <Chip
          selected={!selectedCategory}
          showSelectedCheck={false}
          onPress={() => setSelectedCategory(null)}
          style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
          textStyle={!selectedCategory ? { color: '#fff' } : undefined}
        >
          全部
        </Chip>
        {categories.map(cat => (
          <Chip
            key={cat.name}
            selected={selectedCategory === cat.name}
            showSelectedCheck={false}
            onPress={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
            style={[styles.filterChip, selectedCategory === cat.name && { backgroundColor: cat.color }]}
            textStyle={selectedCategory === cat.name ? { color: '#fff' } : undefined}
          >
            {cat.name}
          </Chip>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {filteredPasswords.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {searchQuery ? '没有找到匹配的记录' : '还没有保存任何密码\n点击右下角按钮添加'}
            </Text>
          </View>
        ) : (
          filteredPasswords.map((item) => (
            <Card key={item.id} style={styles.card} mode="elevated">
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Text variant="titleLarge">{item.website}</Text>
                    <View style={{ width: 8 }} />
                    <Chip
                      compact
                      style={{ backgroundColor: getCategoryColor(item.category) }}
                      textStyle={{ color: '#fff', fontSize: 11 }}
                    >{item.category}</Chip>
                  </View>
                  <View style={styles.cardActions}>
                    <IconButton icon="pencil" size={20} onPress={() => openModal(item)} />
                    <IconButton icon="delete" size={20} onPress={() => handleDelete(item.id)} />
                  </View>
                </View>
                {item.username && (
                  <View style={styles.clickableRow}>
                    <Text variant="bodyMedium" style={styles.cardText}>
                      <Text style={styles.label}>账号：</Text>{item.username}
                    </Text>
                    <IconButton
                      icon="content-copy"
                      size={16}
                      onPress={() => copyToClipboard(item.username, '账号')}
                    />
                  </View>
                )}
                <View style={styles.passwordRow}>
                  <Text variant="bodyMedium" style={styles.cardText}>
                    <Text style={styles.label}>密码：</Text>
                    {visiblePasswords[item.id] ? item.password : '••••••••'}
                  </Text>
                  <View style={styles.passwordActions}>
                    <IconButton
                      icon="content-copy"
                      size={16}
                      onPress={() => copyToClipboard(item.password, '密码')}
                    />
                    <IconButton
                      icon={visiblePasswords[item.id] ? 'eye-off' : 'eye'}
                      size={20}
                      onPress={() => togglePasswordVisibility(item.id)}
                    />
                  </View>
                </View>
                {item.notes && (
                  <Text variant="bodySmall" style={styles.notes}>
                    {item.notes}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <Portal>
        <Modal visible={visible} onDismiss={closeModal} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }, keyboardHeight > 0 && { marginBottom: keyboardHeight }]}>
          <Text variant="headlineSmall" style={styles.modalTitle}>
            {editingId ? '编辑密码' : '添加密码'}
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <TextInput
              label="网站/应用 *"
              value={formData.website}
              onChangeText={(text) => {
                setFormData({ ...formData, website: text });
                if (errors.website) setErrors({ ...errors, website: false });
              }}
              style={styles.input}
              mode="outlined"
              error={errors.website}
            />
            <TextInput
              label="账号/用户名 *"
              value={formData.username}
              onChangeText={(text) => {
                setFormData({ ...formData, username: text });
                if (errors.username) setErrors({ ...errors, username: false });
              }}
              style={styles.input}
              mode="outlined"
              error={errors.username}
            />
            <TextInput
              label="密码 *"
              value={formData.password}
              onChangeText={(text) => {
                setFormData({ ...formData, password: text });
                if (errors.password) setErrors({ ...errors, password: false });
              }}
              style={styles.input}
              mode="outlined"
              error={errors.password}
              secureTextEntry={!showPasswordInForm}
              right={
                <TextInput.Icon
                  icon={showPasswordInForm ? 'eye-off' : 'eye'}
                  onPress={() => setShowPasswordInForm(!showPasswordInForm)}
                />
              }
            />
            <Text variant="labelLarge" style={styles.categoryLabel}>分类</Text>
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <Chip
                  key={cat.name}
                  selected={formData.category === cat.name}
                  showSelectedCheck={false}
                  onPress={() => setFormData({ ...formData, category: cat.name })}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: formData.category === cat.name ? cat.color : undefined },
                  ]}
                  textStyle={formData.category === cat.name ? { color: '#fff' } : undefined}
                >
                  {cat.name}
                </Chip>
              ))}
              <Chip
                showSelectedCheck={false}
                style={styles.categoryChip}
                textStyle={{ flex: 1, textAlign: 'center', fontSize: 18 }}
                onPress={() => setManageCategoriesVisible(true)}
              >+</Chip>
            </View>
            <TextInput
              label="备注"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <Button mode="outlined" onPress={closeModal} style={styles.button}>
                取消
              </Button>
              <View style={{ width: 8 }} />
              <Button mode="contained" onPress={handleSave} style={styles.button}>
                保存
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => openModal()}
      />

      {/* 设置对话框 */}
      <Portal>
        <Modal
          visible={settingsVisible}
          onDismiss={() => setSettingsVisible(false)}
          contentContainerStyle={[styles.settingsModal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            设置
          </Text>

          <Text variant="labelLarge" style={styles.settingsSectionTitle}>解锁方式</Text>

          <View style={styles.settingsRow}>
            <View style={styles.settingsRowText}>
              <Text variant="bodyLarge">生物识别解锁</Text>
              <Text variant="bodySmall" style={styles.settingsRowDesc}>使用指纹或面部识别解锁</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={onToggleBiometric}
            />
          </View>

          <Divider style={styles.settingsDivider} />

          <View style={styles.settingsRow}>
            <View style={styles.settingsRowText}>
              <Text variant="bodyLarge">手势密码解锁</Text>
              <Text variant="bodySmall" style={styles.settingsRowDesc}>使用手势图案解锁</Text>
            </View>
            <Switch
              value={gestureEnabled}
              onValueChange={(value) => {
                onToggleGesture(value);
                if (value && hasGesturePassword) {
                  // 已有密码，不需要额外操作
                } else if (!value) {
                  // 关闭手势，无需额外操作
                }
              }}
            />
          </View>

          {gestureEnabled && (
            <>
              <Divider style={styles.settingsDivider} />
              <Button
                mode="outlined"
                icon="gesture"
                onPress={() => {
                  setSettingsVisible(false);
                  setResetGestureVisible(true);
                }}
                style={styles.settingsButton}
              >
                {hasGesturePassword ? '重置手势密码' : '设置手势密码'}
              </Button>
            </>
          )}

          <Divider style={[styles.settingsDivider, { marginTop: 16 }]} />

          <Text variant="labelLarge" style={[styles.settingsSectionTitle, { marginTop: 16 }]}>标签管理</Text>
          <Button
            mode="outlined"
            icon="tag-multiple"
            onPress={() => {
              setSettingsVisible(false);
              setManageCategoriesVisible(true);
            }}
            style={styles.settingsButton}
          >
            管理标签
          </Button>

          <Divider style={[styles.settingsDivider, { marginTop: 16 }]} />
          <Button
            mode="text"
            onPress={() => setSettingsVisible(false)}
            style={styles.settingsButton}
          >
            关闭
          </Button>
        </Modal>
      </Portal>

      {/* 手势密码重置界面 */}
      {resetGestureVisible && (
        <Portal>
          <Modal
            visible={resetGestureVisible}
            onDismiss={() => setResetGestureVisible(false)}
            contentContainerStyle={styles.gestureResetModal}
          >
            <GesturePassword
              isSetup={true}
              onSetup={handleResetGesture}
            />
          </Modal>
        </Portal>
      )}

      {/* 标签管理弹窗 */}
      <Portal>
        <Modal
          visible={manageCategoriesVisible}
          onDismiss={() => { setManageCategoriesVisible(false); setEditingCat(null); }}
          contentContainerStyle={[styles.settingsModal, { backgroundColor: theme.colors.surface }, keyboardHeight > 0 && { marginBottom: keyboardHeight }]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>管理标签</Text>

          <ScrollView style={styles.categoryList} keyboardShouldPersistTaps="handled">
            {categories.map((cat) => (
              <View key={cat.name} style={styles.categoryListItem}>
                <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                {editingCat?.name === cat.name ? (
                  <>
                    <TextInput
                      value={editingCat.value}
                      onChangeText={v => setEditingCat({ ...editingCat, value: v })}
                      mode="outlined"
                      dense
                      style={{ flex: 1, marginRight: 4 }}
                      autoFocus
                      onSubmitEditing={handleRenameCategoryConfirm}
                    />
                    <IconButton icon="check" size={18} onPress={handleRenameCategoryConfirm} />
                    <IconButton icon="close" size={18} onPress={() => setEditingCat(null)} />
                  </>
                ) : (
                  <>
                    <Text variant="bodyLarge" style={{ flex: 1 }}>{cat.name}</Text>
                    <IconButton icon="pencil" size={18} onPress={() => setEditingCat({ name: cat.name, value: cat.name })} />
                    <IconButton icon="delete-outline" size={18} onPress={() => handleDeleteCategory(cat)} />
                  </>
                )}
              </View>
            ))}
          </ScrollView>

          <Divider style={{ marginVertical: 12 }} />

          <Text variant="labelMedium" style={{ marginBottom: 8, opacity: 0.6 }}>选择颜色</Text>
          <View style={styles.colorPalette}>
            {['#F44336','#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#03A9F4','#00BCD4',
              '#009688','#4CAF50','#8BC34A','#CDDC39','#FFC107','#FF9800','#FF5722','#607D8B',
            ].map(color => (
              <View
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  newCategoryColor === color && styles.colorSwatchSelected,
                ]}
                onTouchEnd={() => setNewCategoryColor(color)}
              />
            ))}
          </View>

          <View style={[styles.addCategoryRow, { marginTop: 12 }]}>
            <View style={[styles.colorDot, { backgroundColor: newCategoryColor, marginRight: 8 }]} />
            <TextInput
              label="新标签名称"
              value={newCategoryInput}
              onChangeText={setNewCategoryInput}
              mode="outlined"
              style={{ flex: 1, marginRight: 8 }}
              dense
              onSubmitEditing={handleAddCategory}
            />
            <Button mode="contained" onPress={handleAddCategory}>
              添加
            </Button>
          </View>

          <Button
            mode="text"
            onPress={() => { setManageCategoriesVisible(false); setEditingCat(null); }}
            style={{ marginTop: 12 }}
          >
            关闭
          </Button>
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lockScreen: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  lockCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gestureModal: {
    margin: 0,
    flex: 1,
    justifyContent: 'center',
  },
  lockTitle: {
    marginBottom: 10,
    fontWeight: 'bold',
  },
  lockSubtitle: {
    marginBottom: 30,
    opacity: 0.7,
  },
  unlockButton: {
    minWidth: 200,
  },
  orText: {
    opacity: 0.4,
    marginBottom: 8,
  },

  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  filterBar: {
    flexGrow: 0,
    marginBottom: 4,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    marginRight: 0,
  },
  filterChipActive: {
    backgroundColor: '#6200ee',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: -8,
  },
  cardText: {
    marginTop: 4,
  },
  clickableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  passwordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: 'bold',
  },
  notes: {
    marginTop: 8,
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  categoryLabel: {
    marginBottom: 8,
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
    minWidth: 64,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    minWidth: 100,
  },
  settingsModal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  settingsSectionTitle: {
    marginBottom: 8,
    opacity: 0.6,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingsRowText: {
    flex: 1,
    marginRight: 16,
  },
  settingsRowDesc: {
    opacity: 0.6,
    marginTop: 2,
  },
  settingsDivider: {
    marginVertical: 4,
  },
  settingsButton: {
    marginTop: 12,
  },
  gestureResetModal: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  categoryList: {
    maxHeight: 240,
  },
  categoryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  addCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 10,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: '#000',
    transform: [{ scale: 1.15 }],
  },
});

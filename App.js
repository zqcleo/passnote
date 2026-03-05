import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Platform, Clipboard } from 'react-native';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme, Appbar, FAB, Portal, Modal, TextInput, Button, Card, Text, IconButton, Searchbar, Chip, useTheme, Snackbar } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <MainApp isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
    </PaperProvider>
  );
}

function MainApp({ isDarkMode, setIsDarkMode }) {
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
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    website: '',
    notes: '',
    category: '其他',
  });

  const categories = ['社交', '邮箱', '银行', '工作', '购物', '其他'];

  useEffect(() => {
    loadPasswords();
  }, []);

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
        category: '其他',
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

  const filteredPasswords = passwords.filter(p =>
    p.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="密码备忘录" />
        <Appbar.Action
          icon={isDarkMode ? 'white-balance-sunny' : 'moon-waning-crescent'}
          onPress={() => setIsDarkMode(!isDarkMode)}
        />
      </Appbar.Header>

      <Searchbar
        placeholder="搜索..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

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
                    <Chip compact>{item.category}</Chip>
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
        <Modal visible={visible} onDismiss={closeModal} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          <Text variant="headlineSmall" style={styles.modalTitle}>
            {editingId ? '编辑密码' : '添加密码'}
          </Text>
          <ScrollView>
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
                  key={cat}
                  selected={formData.category === cat}
                  onPress={() => setFormData({ ...formData, category: cat })}
                  style={styles.categoryChip}
                >
                  {cat}
                </Chip>
              ))}
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
  searchbar: {
    margin: 16,
    marginBottom: 8,
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
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  button: {
    minWidth: 100,
  },
});

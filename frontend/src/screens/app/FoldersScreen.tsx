import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getFolders, createFolder, deleteFolder } from '../../api/folders';
import { Folder } from '../../types';
import FolderCard from '../../components/FolderCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FoldersStackParamList } from '../../navigation/AppNavigator';

type NavProp = StackNavigationProp<FoldersStackParamList, 'FoldersList'>;

const FoldersScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadFolders = useCallback(async () => {
    try {
      const data = await getFolders();
      setFolders(data);
    } catch {
      Alert.alert('Error', 'Failed to load folders.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={{ marginRight: 16 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 24 }}>+</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleCreate = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Validation', 'Folder name is required.');
      return;
    }
    setCreating(true);
    try {
      const folder = await createFolder({ Name: newFolderName.trim() });
      setFolders((prev) => [...prev, folder]);
      setNewFolderName('');
      setShowCreateModal(false);
    } catch {
      Alert.alert('Error', 'Failed to create folder.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (folder: Folder) => {
    Alert.alert('Delete Folder', `Delete "${folder.Name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFolder(folder.Id);
            setFolders((prev) => prev.filter((f) => f.Id !== folder.Id));
          } catch {
            Alert.alert('Error', 'Failed to delete folder.');
          }
        },
      },
    ]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFolders();
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      {folders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📁</Text>
          <Text style={styles.emptyText}>No folders yet</Text>
          <Text style={styles.emptyHint}>Tap + to create your first folder</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createBtnText}>Create Folder</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={folders}
          keyExtractor={(item) => item.Id}
          renderItem={({ item }) => (
            <View>
              <FolderCard
                folder={item}
                onPress={(f) =>
                  navigation.navigate('FolderDetail', {
                    folderId: f.Id,
                    folderName: f.Name,
                  })
                }
              />
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item)}
              >
                <Text style={styles.deleteBtnText}>🗑</Text>
              </TouchableOpacity>
            </View>
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Folder</Text>
            <TextInput
              style={styles.modalInput}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Folder name"
              placeholderTextColor="#9aa0a6"
              autoFocus
            />
            {creating ? (
              <LoadingSpinner />
            ) : (
              <>
                <TouchableOpacity style={styles.modalBtn} onPress={handleCreate}>
                  <Text style={styles.modalBtnText}>Create</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => { setShowCreateModal(false); setNewFolderName(''); }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#202124', marginBottom: 4 },
  emptyHint: { fontSize: 14, color: '#80868b', marginBottom: 24 },
  createBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  deleteBtn: {
    position: 'absolute',
    right: 20,
    top: 14,
    padding: 4,
  },
  deleteBtnText: { fontSize: 18 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#202124', marginBottom: 16 },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#dadce0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#202124',
    marginBottom: 16,
  },
  modalBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalCancel: { alignItems: 'center', paddingVertical: 10 },
  modalCancelText: { color: '#5f6368', fontSize: 14 },
});

export default FoldersScreen;

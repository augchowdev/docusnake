import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getFolder, createFolder, deleteFolder } from '../../api/folders';
import { deleteDocument } from '../../api/documents';
import { exportDocuments } from '../../api/export';
import { Folder, Document } from '../../types';
import DocumentCard from '../../components/DocumentCard';
import FolderCard from '../../components/FolderCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FoldersStackParamList } from '../../navigation/AppNavigator';

type RouteProps = RouteProp<FoldersStackParamList, 'FolderDetail'>;
type NavProp = StackNavigationProp<FoldersStackParamList, 'FolderDetail'>;

const FolderDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const { folderId, folderName } = route.params;

  const [folder, setFolder] = useState<Folder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSubfolderModal, setShowSubfolderModal] = useState(false);
  const [newSubfolderName, setNewSubfolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const loadFolder = useCallback(async () => {
    try {
      const data = await getFolder(folderId);
      setFolder(data);
    } catch {
      Alert.alert('Error', 'Failed to load folder.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [folderId]);

  useEffect(() => {
    loadFolder();
  }, [loadFolder]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: folderName,
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 16, marginRight: 16 }}>
          <TouchableOpacity onPress={() => setShowExportModal(true)}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSubfolderModal(true)}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 24 }}>+</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, folderName]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFolder();
  };

  const handleCreateSubfolder = async () => {
    if (!newSubfolderName.trim()) {
      Alert.alert('Validation', 'Subfolder name is required.');
      return;
    }
    setCreating(true);
    try {
      await createFolder({ Name: newSubfolderName.trim(), ParentFolderId: folderId });
      setNewSubfolderName('');
      setShowSubfolderModal(false);
      loadFolder();
    } catch {
      Alert.alert('Error', 'Failed to create subfolder.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSubfolder = (subfolder: Folder) => {
    Alert.alert('Delete Folder', `Delete "${subfolder.Name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFolder(subfolder.Id);
            loadFolder();
          } catch {
            Alert.alert('Error', 'Failed to delete subfolder.');
          }
        },
      },
    ]);
  };

  const handleDeleteDocument = (doc: Document) => {
    Alert.alert('Delete Document', `Delete "${doc.Name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(doc.Id);
            loadFolder();
          } catch {
            Alert.alert('Error', 'Failed to delete document.');
          }
        },
      },
    ]);
  };

  const handleExport = async (format: 'excel' | 'csv') => {
    setExportLoading(true);
    try {
      await exportDocuments(format, folderId);
      setShowExportModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed.';
      Alert.alert('Export Error', msg);
    } finally {
      setExportLoading(false);
    }
  };

  if (isLoading || !folder) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{folder.Documents?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Documents</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fef7e0' }]}>
          <Text style={styles.statNumber}>{folder.Children?.length ?? 0}</Text>
          <Text style={styles.statLabel}>Subfolders</Text>
        </View>
      </View>

      {folder.Children && folder.Children.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📁 Subfolders</Text>
          {folder.Children.map((child) => (
            <View key={child.Id}>
              <FolderCard
                folder={child}
                onPress={(f) =>
                  navigation.push('FolderDetail', {
                    folderId: f.Id,
                    folderName: f.Name,
                  })
                }
              />
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteSubfolder(child)}
              >
                <Text style={styles.deleteBtnText}>🗑</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📄 Documents</Text>
        {!folder.Documents || folder.Documents.length === 0 ? (
          <Text style={styles.emptyText}>No documents in this folder.</Text>
        ) : (
          folder.Documents.map((doc) => (
            <View key={doc.Id}>
              <DocumentCard
                document={doc}
                onPress={() => {}}
              />
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteDocument(doc)}
              >
                <Text style={styles.deleteBtnText}>🗑</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Subfolder Modal */}
      <Modal visible={showSubfolderModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Subfolder</Text>
            <TextInput
              style={styles.modalInput}
              value={newSubfolderName}
              onChangeText={setNewSubfolderName}
              placeholder="Subfolder name"
              placeholderTextColor="#9aa0a6"
              autoFocus
            />
            {creating ? (
              <LoadingSpinner />
            ) : (
              <>
                <TouchableOpacity style={styles.modalBtn} onPress={handleCreateSubfolder}>
                  <Text style={styles.modalBtnText}>Create</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => { setShowSubfolderModal(false); setNewSubfolderName(''); }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal visible={showExportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Export Folder</Text>
            <Text style={styles.modalSubtitle}>Export documents in "{folderName}"</Text>
            {exportLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#1a73e8' }]}
                  onPress={() => handleExport('excel')}
                >
                  <Text style={styles.modalBtnText}>📊 Export as Excel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#34a853' }]}
                  onPress={() => handleExport('csv')}
                >
                  <Text style={styles.modalBtnText}>📋 Export as CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setShowExportModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingBottom: 40 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: '#e8f0fe',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#1a73e8' },
  statLabel: { fontSize: 12, color: '#5f6368', marginTop: 2 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202124',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  emptyText: { fontSize: 14, color: '#80868b', paddingHorizontal: 16, paddingVertical: 8 },
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
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#202124', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#80868b', marginBottom: 20 },
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

export default FolderDetailScreen;

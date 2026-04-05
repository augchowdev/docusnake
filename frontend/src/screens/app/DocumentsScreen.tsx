import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getDocuments, deleteDocument } from '../../api/documents';
import { getFolders } from '../../api/folders';
import { exportDocuments } from '../../api/export';
import { Document, Folder } from '../../types';
import DocumentCard from '../../components/DocumentCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { DocumentsStackParamList } from '../../navigation/AppNavigator';

type NavProp = StackNavigationProp<DocumentsStackParamList, 'DocumentsList'>;

const DocumentsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [docs, fldrs] = await Promise.all([
        getDocuments(selectedFolder),
        getFolders(),
      ]);
      setDocuments(docs);
      setFolders(fldrs);
    } catch {
      Alert.alert('Error', 'Failed to load documents.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedFolder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setShowExportModal(true)} style={{ marginRight: 16 }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Export</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDelete = (doc: Document) => {
    Alert.alert('Delete Document', `Delete "${doc.Name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(doc.Id);
            setDocuments((prev) => prev.filter((d) => d.Id !== doc.Id));
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
      await exportDocuments(format, selectedFolder);
      setShowExportModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed.';
      Alert.alert('Export Error', msg);
    } finally {
      setExportLoading(false);
    }
  };

  const flattenFolders = (fldrs: Folder[]): Folder[] => {
    const result: Folder[] = [];
    const recurse = (items: Folder[]) => {
      items.forEach((f) => {
        result.push(f);
        if (f.Children?.length) recurse(f.Children);
      });
    };
    recurse(fldrs);
    return result;
  };

  const allFolders = flattenFolders(folders);

  const filtered = documents.filter((d) =>
    d.Name.toLowerCase().includes(search.toLowerCase()),
  );

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search documents..."
        placeholderTextColor="#9aa0a6"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !selectedFolder && styles.filterChipActive]}
          onPress={() => setSelectedFolder(undefined)}
        >
          <Text style={[styles.filterChipText, !selectedFolder && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {allFolders.map((f) => (
          <TouchableOpacity
            key={f.Id}
            style={[styles.filterChip, selectedFolder === f.Id && styles.filterChipActive]}
            onPress={() => setSelectedFolder(f.Id)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFolder === f.Id && styles.filterChipTextActive,
              ]}
              numberOfLines={1}
            >
              {f.Name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyText}>No documents found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.Id}
          renderItem={({ item }) => (
            <View>
              <DocumentCard
                document={item}
                onPress={(d) => navigation.navigate('DocumentDetail', { documentId: d.Id })}
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

      <Modal visible={showExportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Export Documents</Text>
            <Text style={styles.modalSubtitle}>
              {selectedFolder ? 'Exporting selected folder' : 'Exporting all documents'}
            </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  search: {
    margin: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#dadce0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#202124',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 6,
    flexWrap: 'nowrap',
  },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e0e0e0',
    marginRight: 6,
  },
  filterChipActive: { backgroundColor: '#1a73e8' },
  filterChipText: { fontSize: 12, color: '#5f6368', fontWeight: '500' },
  filterChipTextActive: { color: '#fff' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#80868b' },
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
  modalBtn: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalCancel: { alignItems: 'center', paddingVertical: 10 },
  modalCancelText: { color: '#5f6368', fontSize: 14 },
});

export default DocumentsScreen;

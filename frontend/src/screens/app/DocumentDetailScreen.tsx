import React, { useEffect, useState, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getDocument, updateDocument, deleteDocument, extractDocument } from '../../api/documents';
import { getFolders } from '../../api/folders';
import { Document, Folder } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { DocumentsStackParamList } from '../../navigation/AppNavigator';

type RouteProps = RouteProp<DocumentsStackParamList, 'DocumentDetail'>;
type NavProp = StackNavigationProp<DocumentsStackParamList, 'DocumentDetail'>;

const DocumentDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const { documentId } = route.params;

  const [document, setDocument] = useState<Document | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [editName, setEditName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadDocument = useCallback(async () => {
    try {
      const [doc, fldrs] = await Promise.all([getDocument(documentId), getFolders()]);
      setDocument(doc);
      setEditName(doc.Name);
      setFolders(fldrs);
    } catch {
      Alert.alert('Error', 'Failed to load document.');
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: document?.Name ?? 'Document',
    });
  }, [navigation, document]);

  const handleExtract = async () => {
    if (!document) return;
    setExtracting(true);
    try {
      const updated = await extractDocument(document.Id);
      setDocument(updated);
    } catch {
      Alert.alert('Error', 'Extraction failed.');
    } finally {
      setExtracting(false);
    }
  };

  const handleRename = async () => {
    if (!document || !editName.trim()) return;
    setSaving(true);
    try {
      const updated = await updateDocument(document.Id, {
        Name: editName.trim(),
        FolderId: document.FolderId,
        OriginalImagePath: document.OriginalImagePath,
        ExtractedText: document.ExtractedText,
        ExtractedData: document.ExtractedData,
      });
      setDocument(updated);
      setShowRenameModal(false);
    } catch {
      Alert.alert('Error', 'Failed to rename.');
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (folderId: string | null) => {
    if (!document) return;
    setSaving(true);
    try {
      const updated = await updateDocument(document.Id, {
        Name: document.Name,
        FolderId: folderId,
        OriginalImagePath: document.OriginalImagePath,
        ExtractedText: document.ExtractedText,
        ExtractedData: document.ExtractedData,
      });
      setDocument(updated);
      setShowMoveModal(false);
    } catch {
      Alert.alert('Error', 'Failed to move document.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!document) return;
    Alert.alert('Delete Document', `Delete "${document.Name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDocument(document.Id);
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  const renderExtractedData = () => {
    if (!document?.ExtractedData) return null;
    try {
      const data = JSON.parse(document.ExtractedData) as Record<string, string>;
      return Object.entries(data).map(([key, value]) => (
        <View key={key} style={styles.dataRow}>
          <Text style={styles.dataKey}>{key.replace(/_/g, ' ')}</Text>
          <Text style={styles.dataValue}>{value}</Text>
        </View>
      ));
    } catch {
      return <Text style={styles.dataValue}>{document.ExtractedData}</Text>;
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

  if (isLoading || !document) return <LoadingSpinner fullScreen />;

  const allFolders = flattenFolders(folders);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.docIcon}>📄</Text>
        <Text style={styles.docName}>{document.Name}</Text>
        <Text style={styles.docMeta}>
          Created {new Date(document.CreatedAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        </Text>
        {document.FolderName && (
          <View style={styles.folderBadge}>
            <Text style={styles.folderBadgeText}>📁 {document.FolderName}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowRenameModal(true)}>
          <Text style={styles.actionIcon}>✏️</Text>
          <Text style={styles.actionLabel}>Rename</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowMoveModal(true)}>
          <Text style={styles.actionIcon}>📂</Text>
          <Text style={styles.actionLabel}>Move</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
          <Text style={styles.actionIcon}>🗑</Text>
          <Text style={[styles.actionLabel, { color: '#ea4335' }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Extracted Data</Text>
          <TouchableOpacity
            style={styles.extractBtn}
            onPress={handleExtract}
            disabled={extracting}
          >
            {extracting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.extractBtnText}>
                {document.ExtractedData ? '🔄 Re-extract' : '✨ Extract'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {document.ExtractedData ? (
          <View style={styles.extractedCard}>{renderExtractedData()}</View>
        ) : (
          <Text style={styles.noData}>
            No extracted data yet. Tap Extract to analyze this document.
          </Text>
        )}
      </View>

      {document.ExtractedText ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Raw Text</Text>
          <View style={styles.rawTextCard}>
            <Text style={styles.rawText}>{document.ExtractedText}</Text>
          </View>
        </View>
      ) : null}

      {/* Rename Modal */}
      <Modal visible={showRenameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Rename Document</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Document name"
              autoFocus
            />
            {saving ? (
              <LoadingSpinner />
            ) : (
              <>
                <TouchableOpacity style={styles.modalBtn} onPress={handleRename}>
                  <Text style={styles.modalBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setShowRenameModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Move Modal */}
      <Modal visible={showMoveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modal}>
            <Text style={styles.modalTitle}>Move to Folder</Text>
            <TouchableOpacity
              style={[
                styles.folderOption,
                !document.FolderId && styles.folderOptionActive,
              ]}
              onPress={() => handleMove(null)}
            >
              <Text style={styles.folderOptionText}>📂 No Folder (Root)</Text>
            </TouchableOpacity>
            {allFolders.map((f) => (
              <TouchableOpacity
                key={f.Id}
                style={[
                  styles.folderOption,
                  document.FolderId === f.Id && styles.folderOptionActive,
                ]}
                onPress={() => handleMove(f.Id)}
              >
                <Text style={styles.folderOptionText}>📁 {f.Name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowMoveModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingBottom: 40 },
  card: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  docIcon: { fontSize: 48, marginBottom: 8 },
  docName: { fontSize: 20, fontWeight: '800', color: '#202124', textAlign: 'center' },
  docMeta: { fontSize: 13, color: '#80868b', marginTop: 4 },
  folderBadge: {
    marginTop: 8,
    backgroundColor: '#fef7e0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  folderBadgeText: { fontSize: 13, color: '#f9ab00', fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionBtn: { alignItems: 'center', padding: 12 },
  actionIcon: { fontSize: 24, marginBottom: 4 },
  actionLabel: { fontSize: 12, color: '#5f6368', fontWeight: '600' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#202124' },
  extractBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  extractBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  extractedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dataRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dataKey: { width: 120, fontSize: 13, fontWeight: '600', color: '#5f6368', textTransform: 'capitalize' },
  dataValue: { flex: 1, fontSize: 13, color: '#202124' },
  noData: { fontSize: 14, color: '#80868b', textAlign: 'center', padding: 20 },
  rawTextCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rawText: { fontSize: 13, color: '#202124', lineHeight: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '82%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxHeight: '70%',
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
  folderOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  folderOptionActive: { backgroundColor: '#e8f0fe' },
  folderOptionText: { fontSize: 15, color: '#202124' },
});

export default DocumentDetailScreen;

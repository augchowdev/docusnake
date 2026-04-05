import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { getDocuments } from '../../api/documents';
import { getFolders } from '../../api/folders';
import { Document, Folder } from '../../types';
import DocumentCard from '../../components/DocumentCard';
import FolderCard from '../../components/FolderCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { HomeStackParamList } from '../../navigation/AppNavigator';

type NavProp = StackNavigationProp<HomeStackParamList, 'HomeMain'>;

const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NavProp>();
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [docs, fldrs] = await Promise.all([getDocuments(), getFolders()]);
      const sorted = [...docs].sort(
        (a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime(),
      );
      setRecentDocs(sorted.slice(0, 5));
      setFolders(fldrs.slice(0, 3));
    } catch {
      Alert.alert('Error', 'Failed to load data.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Welcome back,</Text>
        <Text style={styles.username}>{user?.username} 👋</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{recentDocs.length}</Text>
          <Text style={styles.statLabel}>Recent Docs</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fef7e0' }]}>
          <Text style={styles.statNumber}>{folders.length}</Text>
          <Text style={styles.statLabel}>Folders</Text>
        </View>
      </View>

      {folders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📁 Recent Folders</Text>
          {folders.map((folder) => (
            <FolderCard key={folder.Id} folder={folder} onPress={() => {}} />
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📄 Recent Documents</Text>
        {recentDocs.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No documents yet.</Text>
            <Text style={styles.emptyHint}>Tap the Scan tab to add your first document.</Text>
          </View>
        ) : (
          recentDocs.map((doc) => (
            <DocumentCard
              key={doc.Id}
              document={doc}
              onPress={(d) => navigation.navigate('DocumentDetail', { documentId: d.Id })}
            />
          ))
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { paddingBottom: 32 },
  greeting: { padding: 20, paddingBottom: 8 },
  greetingText: { fontSize: 14, color: '#5f6368' },
  username: { fontSize: 22, fontWeight: '800', color: '#202124', marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginVertical: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#e8f0fe',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#1a73e8' },
  statLabel: { fontSize: 12, color: '#5f6368', marginTop: 2 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#202124', paddingHorizontal: 16, marginBottom: 4 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#80868b' },
  emptyHint: { fontSize: 13, color: '#9aa0a6', marginTop: 4, textAlign: 'center' },
  logoutBtn: {
    margin: 24,
    borderWidth: 1.5,
    borderColor: '#ea4335',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: { color: '#ea4335', fontWeight: '700', fontSize: 15 },
});

export default HomeScreen;

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Folder } from '../types';

interface Props {
  folder: Folder;
  onPress: (folder: Folder) => void;
  depth?: number;
}

const FolderCard: React.FC<Props> = ({ folder, onPress, depth = 0 }) => {
  const docCount = folder.Documents?.length ?? 0;
  const childCount = folder.Children?.length ?? 0;

  return (
    <TouchableOpacity
      style={[styles.card, { marginLeft: depth * 16 + 16 }]}
      onPress={() => onPress(folder)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>📁</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {folder.Name}
        </Text>
        <Text style={styles.meta}>
          {docCount} {docCount === 1 ? 'document' : 'documents'}
          {childCount > 0 ? ` · ${childCount} subfolder${childCount > 1 ? 's' : ''}` : ''}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginRight: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#fef7e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: '#80868b',
  },
  chevron: {
    fontSize: 22,
    color: '#bdc1c6',
    marginLeft: 8,
  },
});

export default FolderCard;

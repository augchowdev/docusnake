import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Document } from '../types';

interface Props {
  document: Document;
  onPress: (doc: Document) => void;
}

const DocumentCard: React.FC<Props> = ({ document, onPress }) => {
  const createdAt = new Date(document.CreatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const hasExtracted = Boolean(document.ExtractedData || document.ExtractedText);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(document)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>📄</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {document.Name}
        </Text>
        <Text style={styles.meta}>
          {createdAt}
          {document.FolderName ? ` · ${document.FolderName}` : ''}
        </Text>
        {hasExtracted && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Data extracted</Text>
          </View>
        )}
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
    marginHorizontal: 16,
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
    backgroundColor: '#e8f0fe',
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
  badge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#e6f4ea',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    color: '#137333',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 22,
    color: '#bdc1c6',
    marginLeft: 8,
  },
});

export default DocumentCard;

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from './client';
import { getToken } from '../utils/storage';
import { ExportFormat } from '../types';

export const exportDocuments = async (
  format: ExportFormat,
  folderId?: string,
): Promise<void> => {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated');

  const endpoint = format === 'excel' ? 'excel' : 'csv';
  const ext = format === 'excel' ? 'xlsx' : 'csv';
  const params = folderId ? `?folderId=${folderId}` : '';
  const url = `${API_BASE_URL}/api/export/${endpoint}${params}`;

  const fileUri = `${FileSystem.documentDirectory}docusnake_export.${ext}`;

  const result = await FileSystem.downloadAsync(url, fileUri, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (result.status !== 200) {
    throw new Error(`Export failed with status ${result.status}`);
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(result.uri, {
    mimeType:
      format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv',
    dialogTitle: `Export Documents as ${format.toUpperCase()}`,
  });
};

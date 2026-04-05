import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { createDocument } from '../../api/documents';
import LoadingSpinner from '../../components/LoadingSpinner';

type ScanStep = 'camera' | 'preview' | 'saving';

const ScanScreen: React.FC = () => {
  const navigation = useNavigation();
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>(CameraType.back);
  const [step, setStep] = useState<ScanStep>('camera');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [docName, setDocName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        setDocName(`Scan ${new Date().toLocaleDateString()}`);
        setStep('preview');
      }
    } catch {
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library access is needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      setCapturedUri(result.assets[0].uri);
      setDocName(`Scan ${new Date().toLocaleDateString()}`);
      setStep('preview');
    }
  };

  const handleSave = async () => {
    if (!docName.trim()) {
      Alert.alert('Name Required', 'Please enter a document name.');
      return;
    }
    setIsSaving(true);
    setStep('saving');
    try {
      const doc = await createDocument({
        Name: docName.trim(),
        FolderId: selectedFolder,
        OriginalImagePath: capturedUri ?? undefined,
      });
      Alert.alert('Success', `"${doc.Name}" saved!`, [
        {
          text: 'View Document',
          onPress: () => {
            setStep('camera');
            setCapturedUri(null);
            setDocName('');
            navigation.navigate('DocumentsTab' as never);
          },
        },
        {
          text: 'Scan Another',
          onPress: () => {
            setStep('camera');
            setCapturedUri(null);
            setDocName('');
          },
        },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save document.');
      setStep('preview');
    } finally {
      setIsSaving(false);
    }
  };

  if (step === 'saving' || isSaving) {
    return (
      <View style={styles.savingContainer}>
        <LoadingSpinner />
        <Text style={styles.savingText}>Saving document…</Text>
      </View>
    );
  }

  if (step === 'preview' && capturedUri) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.previewContent}>
        <Text style={styles.previewTitle}>Preview</Text>
        <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="contain" />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Document Name</Text>
          <TextInput
            style={styles.input}
            value={docName}
            onChangeText={setDocName}
            placeholder="Enter document name"
            placeholderTextColor="#9aa0a6"
            autoFocus
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => { setStep('camera'); setCapturedUri(null); }}
          >
            <Text style={styles.btnSecondaryText}>📷 Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleSave}>
            <Text style={styles.btnPrimaryText}>💾 Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (!permission) {
    return <LoadingSpinner fullScreen />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          Docusnake needs camera access to scan documents.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.permissionBtn, styles.permissionBtnSecondary]} onPress={handlePickImage}>
          <Text style={styles.permissionBtnSecondaryText}>Choose from Library</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <Camera ref={cameraRef} style={styles.camera} type={facing}>
        <View style={styles.cameraOverlay}>
          <View style={styles.scanFrame} />
        </View>
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.galleryBtn} onPress={handlePickImage}>
            <Text style={styles.galleryBtnText}>🖼</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.flipBtn}
            onPress={() => setFacing((f) => (f === CameraType.back ? CameraType.front : CameraType.back))}
          >
            <Text style={styles.flipBtnText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </Camera>
      <Text style={styles.cameraHint}>Position document within frame and tap capture</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  previewContent: { padding: 16, paddingBottom: 40 },
  previewTitle: { fontSize: 20, fontWeight: '800', color: '#202124', marginBottom: 12 },
  previewImage: {
    width: '100%',
    height: 340,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    marginBottom: 20,
  },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#5f6368', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: '#dadce0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#202124',
    backgroundColor: '#fff',
  },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#1a73e8' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnSecondary: { borderWidth: 1.5, borderColor: '#dadce0', backgroundColor: '#fff' },
  btnSecondaryText: { color: '#5f6368', fontWeight: '600', fontSize: 15 },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: '80%',
    height: '55%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
  },
  cameraControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  flipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipBtnText: { fontSize: 22 },
  galleryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryBtnText: { fontSize: 22 },
  cameraHint: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 24,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  savingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  savingText: { fontSize: 16, color: '#5f6368', marginTop: 12 },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  permissionIcon: { fontSize: 56, marginBottom: 16 },
  permissionTitle: { fontSize: 20, fontWeight: '800', color: '#202124', marginBottom: 8 },
  permissionText: { fontSize: 14, color: '#5f6368', textAlign: 'center', marginBottom: 24 },
  permissionBtn: {
    backgroundColor: '#1a73e8',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 32,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  permissionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  permissionBtnSecondary: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#dadce0' },
  permissionBtnSecondaryText: { color: '#1a73e8', fontWeight: '600', fontSize: 15 },
});

export default ScanScreen;

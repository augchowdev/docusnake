import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import LoadingSpinner from '../../components/LoadingSpinner';

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, 'Register'>;
};

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    if (username.trim().length < 3) {
      Alert.alert('Validation', 'Username must be at least 3 characters.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Validation', 'Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    try {
      await register({
        Username: username.trim(),
        Email: email.trim(),
        Password: password,
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🐍</Text>
          <Text style={styles.title}>Docusnake</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="johndoe"
            placeholderTextColor="#9aa0a6"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9aa0a6"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min. 6 characters"
            placeholderTextColor="#9aa0a6"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <TouchableOpacity style={styles.button} onPress={handleRegister} activeOpacity={0.85}>
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.link}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 36 },
  logo: { fontSize: 56, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#1a73e8', letterSpacing: 0.5 },
  subtitle: { fontSize: 15, color: '#5f6368', marginTop: 4 },
  form: {},
  label: { fontSize: 13, fontWeight: '600', color: '#5f6368', marginBottom: 6, marginTop: 16 },
  input: {
    borderWidth: 1.5,
    borderColor: '#dadce0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#202124',
    backgroundColor: '#f8f9fa',
  },
  button: {
    marginTop: 28,
    backgroundColor: '#1a73e8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkRow: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#5f6368' },
  link: { color: '#1a73e8', fontWeight: '600' },
});

export default RegisterScreen;

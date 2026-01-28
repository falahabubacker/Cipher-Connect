import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLogin } from '../hooks/useAuth';
import { Image } from 'react-native';
// Replace SVG logo with PNG

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLogin();

  const handleLogin = () => {
    if (email && password) {
      loginMutation.mutate({ email, password });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/icons/cipher_connect.png')}
            style={{ width: 300, height: 100, resizeMode: 'contain' }}
            accessibilityLabel="App Logo"
          />
        </View>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loginMutation.isPending}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loginMutation.isPending}
          />

          {loginMutation.isError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {loginMutation.error?.message || 'Login failed. Please check your credentials.'}
              </Text>
              {loginMutation.error && (
                <Text style={styles.errorDetail}>
                  {String(loginMutation.error)}
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginButton, loginMutation.isPending && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loginMutation.isPending || !email || !password}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color="#1A2332" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text style={styles.signupLink}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2332',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#F4C430',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#E3E3E3',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#2A3544',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2A3544',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  errorDetail: {
    color: '#EF4444',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: '#F4C430',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  loginButtonText: {
    color: '#1A2332',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 16,
  },
  signupLink: {
    color: '#F4C430',
    fontWeight: 'bold',
  },
});

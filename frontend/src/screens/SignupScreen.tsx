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
  ScrollView,
} from 'react-native';
import { useSignup } from '../hooks/useAuth';

interface SignupScreenProps {
  navigation: any;
}

export default function SignupScreen({ navigation }: SignupScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const signupMutation = useSignup();

  const handleSignup = () => {
    if (name && email && password && confirmPassword) {
      if (password !== confirmPassword) {
        return;
      }
      signupMutation.mutate(
        {
          name,
          email,
          password1: password,
          password2: confirmPassword,
        },
        {
          onSuccess: () => {
            // Navigate back to login after successful signup
            navigation.navigate('Login');
          },
        }
      );
    }
  };

  const passwordsMatch = password === confirmPassword || !confirmPassword;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>CIPHER</Text>
          <Text style={styles.subtitle}>Create your account</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!signupMutation.isPending}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!signupMutation.isPending}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!signupMutation.isPending}
            />

            <TextInput
              style={[
                styles.input,
                !passwordsMatch && styles.inputError,
              ]}
              placeholder="Confirm Password"
              placeholderTextColor="#9CA3AF"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!signupMutation.isPending}
            />

            {!passwordsMatch && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}

            {signupMutation.isError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {signupMutation.error?.message || 'Signup failed. Please try again.'}
                </Text>
              </View>
            )}

            {signupMutation.isSuccess && (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>
                  Account created successfully! Redirecting to login...
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.signupButton,
                (signupMutation.isPending || !name || !email || !password || !confirmPassword || !passwordsMatch) &&
                  styles.signupButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={
                signupMutation.isPending ||
                !name ||
                !email ||
                !password ||
                !confirmPassword ||
                !passwordsMatch
              }
            >
              {signupMutation.isPending ? (
                <ActivityIndicator color="#1A2332" />
              ) : (
                <Text style={styles.signupButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text style={styles.loginLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2332',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
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
  inputError: {
    borderColor: '#EF4444',
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
  successContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  successText: {
    color: '#22C55E',
    fontSize: 14,
    textAlign: 'center',
  },
  signupButton: {
    backgroundColor: '#F4C430',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  signupButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  signupButtonText: {
    color: '#1A2332',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 16,
  },
  loginLink: {
    color: '#F4C430',
    fontWeight: 'bold',
  },
});

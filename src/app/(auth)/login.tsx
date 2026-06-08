import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) Alert.alert('Error', error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    if (!email.trim() || !password) {
      Alert.alert('Campos incompletos', 'Ingresa tu correo y contraseña.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('¡Éxito!', 'Revisa tu correo para verificar la cuenta.');
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a Pedilo</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={signInWithEmail} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Cargando...' : 'Iniciar Sesión'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={signUpWithEmail} disabled={loading}>
        <Text style={styles.secondaryButtonText}>Crear Cuenta como Cliente</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>¿Eres repartidor?</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.button, styles.driverButton]}
        onPress={() => router.push('/(auth)/register-driver')}
        disabled={loading}
      >
        <Text style={styles.driverButtonText}>🛵 Registrarse como Repartidor</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', padding: 15, borderRadius: 12, marginBottom: 14, backgroundColor: '#f9fafb', fontSize: 16 },
  button: { padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  primaryButton: { backgroundColor: '#000' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#000' },
  secondaryButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 15 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { marginHorizontal: 12, color: '#9ca3af', fontSize: 13 },
  driverButton: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb' },
  driverButtonText: { color: '#374151', fontWeight: 'bold', fontSize: 16 },
});

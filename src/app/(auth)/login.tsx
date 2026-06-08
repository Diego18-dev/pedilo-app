import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/services/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
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
        <Text style={styles.secondaryButtonText}>Crear Cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 10, marginBottom: 15 },
  button: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  primaryButton: { backgroundColor: '#000' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#000' },
  secondaryButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});

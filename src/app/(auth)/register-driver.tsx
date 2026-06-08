import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';

export default function RegisterDriverScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName.trim() || !phone.trim() || !email.trim() || !password) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          role: 'driver',
        },
      },
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        '¡Registro exitoso!',
        'Revisa tu correo para verificar tu cuenta. Una vez verificada podrás comenzar a recibir pedidos.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      );
    }
    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Únete como{'\n'}Repartidor 🛵</Text>
      <Text style={styles.subtitle}>Recibe pedidos cerca de ti y gana dinero en Sucre</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Número de celular"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
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

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Registrando...' : 'Registrarse como Repartidor'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 25, backgroundColor: '#fff', justifyContent: 'center' },
  backButton: { marginBottom: 20 },
  backText: { fontSize: 16, color: '#555' },
  title: { fontSize: 32, fontWeight: '900', color: '#111', marginBottom: 8, lineHeight: 38 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 30, lineHeight: 22 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', padding: 15, borderRadius: 12, marginBottom: 14, backgroundColor: '#f9fafb', fontSize: 16 },
  button: { backgroundColor: '#000', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

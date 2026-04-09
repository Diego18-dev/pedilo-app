import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';

export default function ProfileScreen() {
  const { user, profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Al cargar la pantalla, si el usuario ya tiene foto en la BD, la mostramos
  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  // Función para abrir la galería del teléfono
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true, // Permite recortar la foto en un cuadrado
        aspect: [1, 1],      // Proporción cuadrada
        quality: 0.5,        // Comprimimos al 50% para que suba rapidísimo
        base64: true,        // IMPORTANTE: Pedimos la imagen en texto base64
      });

      // Si el usuario no canceló y tenemos el código de la imagen, la subimos
      if (!result.canceled && result.assets[0].base64) {
        uploadAvatar(result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  // Función para subir a Supabase Storage y guardar en la BD
  const uploadAvatar = async (base64File: string) => {
    if (!user) return;
    setUploading(true);

    try {
      // 1. Creamos un nombre único (ej: IDdelUsuario/163532_avatar.jpg)
      const filePath = `${user.id}/${new Date().getTime()}_avatar.jpg`;

      // 2. Subimos el archivo al Bucket 'avatars' usando la conversión mágica 'decode'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64File), {
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // 3. Le pedimos a Supabase la URL pública para poder mostrarla
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const newAvatarUrl = publicUrlData.publicUrl;

      // 4. Guardamos esa URL en la tabla 'profiles'
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 5. Actualizamos el estado visual para que el usuario vea su foto al instante
      setAvatarUrl(newAvatarUrl);
      Alert.alert('¡Éxito!', 'Foto de perfil actualizada correctamente');

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error al subir', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>

      {/* SECCIÓN DE LA FOTO (Avatar) */}
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>Sin foto</Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.editButton} onPress={pickImage} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.editButtonText}>Cambiar Foto</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* SECCIÓN DE INFORMACIÓN DEL PERFIL */}
      <View style={styles.infoContainer}>
        <Text style={styles.label}>Correo Electrónico:</Text>
        <Text style={styles.value}>{user?.email}</Text>

        <Text style={styles.label}>Rol en la App:</Text>
        <Text style={styles.value}>
          {profile?.role === 'driver' ? 'Repartidor 🛵' : 'Cliente 👤'}
        </Text>
      </View>

      {/* BOTÓN DE SALIDA */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#f4f4f4', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, marginTop: 20, color: '#333' },
  
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 3, borderColor: '#000', backgroundColor: '#fff' },
  avatarPlaceholder: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#aaa', borderStyle: 'dashed' },
  avatarText: { color: '#888', fontWeight: 'bold', fontSize: 16 },
  
  editButton: { backgroundColor: '#000', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: -20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  editButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  infoContainer: { width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 15, marginBottom: 40, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
  label: { fontSize: 14, color: '#888', marginBottom: 5 },
  value: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  
  logoutButton: { backgroundColor: '#ff4444', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  logoutButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/store/AuthContext';

// 1. El Guardia que decide a dónde va el usuario
function InitialLayout() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Si Supabase aún está verificando la sesión, no hacemos nada todavía
    if (isLoading) return; 

    // Verificamos si el usuario está intentando acceder a una ruta de autenticación
    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!session && !inAuthGroup) {
      // Regla A: NO tiene sesión y no está en auth -> Lo mandamos al Login
      router.replace('/(auth)/login' as any);
    } else if (session && inAuthGroup) {
      // Regla B: SÍ tiene sesión pero está en la pantalla de Login -> Lo mandamos a la App
      router.replace('/(tabs)' as any);
    }
  }, [session, isLoading, segments]);

  // Pantalla de carga mientras lee AsyncStorage
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  // Si ya cargó, mostramos las pantallas (El router hará el reemplazo si es necesario)
  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

// 2. El componente principal que envuelve todo con el Contexto
export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
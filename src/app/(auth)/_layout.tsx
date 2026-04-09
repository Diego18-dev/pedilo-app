import { Stack } from 'expo-router';

export default function AuthLayout() {
  // headerShown: false oculta la barra superior nativa para que diseñemos la nuestra
  return <Stack screenOptions={{ headerShown: false }} />;
}
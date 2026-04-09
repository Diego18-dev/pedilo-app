import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';

export const useLocation = () => {
  // Guardaremos latitud y longitud aquí
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      // 1. Pedimos permiso al usuario (Aparecerá el popup nativo del sistema)
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMsg('Permiso denegado. No podemos mostrar tu ubicación en el mapa.');
        Alert.alert('Atención', 'Necesitamos tu ubicación para el mapa.');
        setIsLoadingLocation(false);
        return;
      }

      // 2. Encendemos el GPS y traemos las coordenadas exactas
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Balance entre velocidad y precisión
      });
      
      setLocation(currentLocation);
    } catch (error) {
      console.error("Error obteniendo ubicación:", error);
      setErrorMsg('No se pudo obtener la ubicación actual.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Se ejecuta automáticamente al cargar el hook
  useEffect(() => {
    getCurrentLocation();
  }, []);

  return { location, errorMsg, isLoadingLocation, getCurrentLocation };
};
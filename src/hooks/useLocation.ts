import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setIsLoadingLocation(false);
        return;
      }

      // TRUCO SENIOR: En emuladores, siempre pedimos la "Última Conocida" primero
      // porque es instantánea y nunca lanza el error de "Current location unavailable"
      let currentLocation = await Location.getLastKnownPositionAsync().catch(() => null);

      // Si por alguna razón está vacía, intentamos con la actual pero capturando el error
      if (!currentLocation) {
        currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low, 
        }).catch(() => null); 
      }

      if (currentLocation) {
        setLocation(currentLocation);
      }

    } catch (error) {
      // En lugar de romper la app con pantalla roja, solo lo anotamos en la consola
      console.log("⚠️ Advertencia de GPS (Normal en emuladores):", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return { location, isLoadingLocation, getCurrentLocation };
};
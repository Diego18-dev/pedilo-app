import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
      }

      if (status !== 'granted') {
        setIsLoadingLocation(false);
        return;
      }

      let currentLocation = await Location.getLastKnownPositionAsync().catch(() => null);

      if (!currentLocation) {
        currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        }).catch(() => null);
      }

      if (currentLocation) setLocation(currentLocation);
    } catch (error) {
      console.warn('GPS no disponible:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return { location, isLoadingLocation, getCurrentLocation };
};

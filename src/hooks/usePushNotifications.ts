import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const usePushNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const register = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Pedilo',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      const { status: existing } = await Notifications.getPermissionsAsync();
      let status = existing;

      if (existing !== 'granted') {
        const { status: requested } = await Notifications.requestPermissionsAsync();
        status = requested;
      }

      if (status !== 'granted') return;

      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync();
        await supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('id', user.id);
      } catch {
        console.warn('Push notifications no disponibles en este entorno');
      }
    };

    register();
  }, [user]);
};

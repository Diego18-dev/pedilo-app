type PushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export const sendPushNotifications = async (messages: PushMessage | PushMessage[]) => {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.warn('Error enviando notificación push:', error);
  }
};

-- Token de notificaciones push del dispositivo del usuario
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_token TEXT;

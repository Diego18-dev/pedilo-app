-- Actualiza el trigger para leer role y phone del metadata de registro.
-- Solo se acepta 'driver' explícitamente; cualquier otro valor resulta en 'client'.
-- Esto previene que alguien se auto-asigne el rol 'admin'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, phone, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone',
    CASE WHEN new.raw_user_meta_data->>'role' = 'driver'
      THEN 'driver'::user_role
      ELSE 'client'::user_role
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

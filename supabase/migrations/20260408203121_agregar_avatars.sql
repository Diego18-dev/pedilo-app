-- 1. Agregar la nueva columna a nuestra tabla existente
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Crear el "Bucket" (carpeta en la nube) llamado 'avatars'
-- Le decimos que es público para que la app pueda mostrar las fotos sin pedir contraseñas por cada imagen
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Seguridad para el Storage (Políticas RLS para archivos)
-- A) Cualquiera (incluso sin login) puede VER las fotos de perfil
CREATE POLICY "Cualquiera puede ver avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- B) Solo los usuarios con sesión iniciada pueden SUBIR fotos
CREATE POLICY "Usuarios logueados pueden subir avatars" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- C) Solo los usuarios con sesión iniciada pueden ACTUALIZAR sus fotos
CREATE POLICY "Usuarios logueados pueden actualizar avatars" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'avatars');
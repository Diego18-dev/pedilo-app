-- Permitir que los usuarios actualicen sus propios datos (como la foto)
CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
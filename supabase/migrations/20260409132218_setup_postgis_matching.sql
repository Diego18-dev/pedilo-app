-- 1. Habilitar la extensión de PostGIS en Supabase
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Añadir la columna de ubicación actual al perfil de los usuarios
-- Usamos 'Point' (un punto exacto en el mapa) y '4326' (estándar GPS)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_location geography(Point, 4326);

-- 3. Crear el Índice Espacial (VITAL PARA ESCALAR)
-- Esto hace que buscar repartidores cercanos tome milisegundos, no segundos
CREATE INDEX IF NOT EXISTS profiles_geo_index 
ON profiles 
USING GIST (current_location);

-- 4. Añadir una columna extra para saber CUÁNDO fue la última actualización
-- Si un repartidor tiene el GPS apagado hace 2 horas, no queremos asignarle pedidos
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP WITH TIME ZONE;
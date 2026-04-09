-- Creamos una función directa en la base de datos para manejar la matemática de PostGIS
CREATE OR REPLACE FUNCTION update_driver_location(lat double precision, lng double precision)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  -- ST_MakePoint requiere (Longitud, Latitud), ST_SetSRID le pone el estándar GPS (4326)
  SET current_location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      last_location_update = NOW()
  WHERE id = auth.uid(); -- Seguridad extrema: solo actualiza al usuario logueado
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
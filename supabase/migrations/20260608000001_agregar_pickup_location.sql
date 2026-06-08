-- Agrega la columna de coordenadas de recojo al pedido (geography para uso con PostGIS)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS pickup_location geography(Point, 4326);

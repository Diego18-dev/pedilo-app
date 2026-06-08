-- Coordenadas de entrega del pedido (complementa pickup_location)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS dropoff_location geography(Point, 4326);

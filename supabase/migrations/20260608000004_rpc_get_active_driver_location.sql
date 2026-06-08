-- Devuelve la ubicación del repartidor activo para un pedido aceptado.
-- Solo el cliente dueño del pedido puede llamar esta función.
CREATE OR REPLACE FUNCTION public.get_active_driver_location(order_id uuid)
RETURNS TABLE(lat double precision, lng double precision)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ST_Y(p.current_location::geometry)::double precision,
    ST_X(p.current_location::geometry)::double precision
  FROM orders o
  JOIN profiles p ON p.id = o.driver_id
  WHERE
    o.id = order_id
    AND o.client_id = auth.uid()
    AND o.status = 'accepted'
    AND p.current_location IS NOT NULL
    AND p.last_location_update > NOW() - INTERVAL '2 minutes';
END;
$$;

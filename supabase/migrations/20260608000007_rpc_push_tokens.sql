-- Devuelve los push tokens de repartidores activos cercanos al punto de recojo.
-- Solo usuarios autenticados pueden llamarla.
CREATE OR REPLACE FUNCTION public.get_driver_push_tokens(
  pickup_lat double precision,
  pickup_lng double precision,
  radio_metros integer DEFAULT 50000
)
RETURNS TABLE(push_token text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.push_token
  FROM profiles p
  WHERE
    p.role = 'driver'
    AND p.push_token IS NOT NULL
    AND p.current_location IS NOT NULL
    AND p.last_location_update > NOW() - INTERVAL '5 minutes'
    AND ST_DWithin(
      p.current_location,
      ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography,
      radio_metros
    );
END;
$$;

-- Devuelve el push token del cliente de un pedido aceptado.
-- Solo el repartidor asignado al pedido puede llamarla.
CREATE OR REPLACE FUNCTION public.get_client_push_token(order_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token text;
BEGIN
  SELECT p.push_token INTO token
  FROM orders o
  JOIN profiles p ON p.id = o.client_id
  WHERE
    o.id = order_id
    AND o.driver_id = auth.uid()
    AND o.status = 'accepted';

  RETURN token;
END;
$$;

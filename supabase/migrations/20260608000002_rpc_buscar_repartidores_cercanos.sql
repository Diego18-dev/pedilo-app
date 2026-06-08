CREATE OR REPLACE FUNCTION public.buscar_repartidores_cercanos(
  pickup_lat double precision,
  pickup_lng double precision,
  radio_metros integer DEFAULT 3000
)
RETURNS TABLE(id uuid, full_name text, avatar_url text, distancia_metros double precision)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    ST_Distance(
      p.current_location,
      ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography
    ) AS distancia_metros
  FROM profiles p
  WHERE
    p.role = 'driver'
    AND p.last_location_update > NOW() - INTERVAL '5 minutes'
    AND ST_DWithin(
      p.current_location,
      ST_SetSRID(ST_MakePoint(pickup_lng, pickup_lat), 4326)::geography,
      radio_metros
    )
  ORDER BY distancia_metros ASC;
END;
$function$;

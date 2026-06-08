CREATE OR REPLACE FUNCTION public.get_nearby_pending_orders(radio_metros integer DEFAULT 3000)
RETURNS SETOF orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  driver_loc geography;
BEGIN
  SELECT current_location INTO driver_loc
  FROM profiles
  WHERE id = auth.uid() AND role = 'driver';

  IF driver_loc IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT *
  FROM orders
  WHERE status = 'pending'
    AND pickup_location IS NOT NULL
    AND ST_DWithin(pickup_location, driver_loc, radio_metros)
  ORDER BY ST_Distance(pickup_location, driver_loc) ASC;
END;
$function$;

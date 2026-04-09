-- Los clientes pueden cancelar o modificar sus propios pedidos
CREATE POLICY "Clients can update own orders" ON orders 
  FOR UPDATE USING (auth.uid() = client_id);

-- Los repartidores pueden actualizar pedidos (aceptarlos si están pendientes, o avanzar el estado si ya son de ellos)
CREATE POLICY "Drivers can update orders" ON orders 
  FOR UPDATE USING (
    status = 'pending' OR auth.uid() = driver_id
  );
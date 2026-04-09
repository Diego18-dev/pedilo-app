-- Permitir que los usuarios autenticados inserten pedidos, 
-- pero SOLO si el client_id coincide con su propio ID de usuario.
CREATE POLICY "Clients can create orders" ON orders 
  FOR INSERT WITH CHECK (auth.uid() = client_id);
-- Habilitar RLS en las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- REGLAS PARA PERFILES
-- Cualquiera puede ver su propio perfil
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

-- REGLAS PARA PEDIDOS
-- Los clientes pueden ver sus propios pedidos
CREATE POLICY "Clients can view own orders" ON orders 
  FOR SELECT USING (auth.uid() = client_id);

-- Los repartidores pueden ver pedidos pendientes o los que ya aceptaron
CREATE POLICY "Drivers can view available or own orders" ON orders 
  FOR SELECT USING (status = 'pending' OR auth.uid() = driver_id);
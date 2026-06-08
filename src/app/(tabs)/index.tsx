import { useAuth } from '@/store/AuthContext';
import ClientDashboard from '@/components/ClientDashboard';
import DriverDashboard from '@/components/DriverDashboard';

export default function OrdersScreen() {
  const { profile } = useAuth();

  if (profile?.role === 'driver') return <DriverDashboard />;
  return <ClientDashboard />;
}

export type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  client_id: string;
  driver_id: string | null;
  description: string;
  origin_address: string;
  destination_address: string;
  pickup_location: string | null;
  dropoff_location: string | null;
  status: OrderStatus;
  price: number | null;
  created_at: string;
  updated_at: string;
}
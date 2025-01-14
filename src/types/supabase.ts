// Add proper type definitions
export interface Order {
  id: string;
  created_at: string;
  client_id: string;
  title: string;
  description: string | null;
  service_type: 'mixing' | 'mastering';
  music_style: string;
  status: OrderStatus;
  price: number;
  files: FileObject[];
  deadline: string | null;
}

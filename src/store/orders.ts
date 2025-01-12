import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import type { OrderStatus, StatusHistoryEntry } from '../types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];

interface OrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  subscribed: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => void;
  loadOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus, notes?: string) => Promise<void>;
  getStatusHistory: (orderId: string) => Promise<StatusHistoryEntry[]>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,
  subscribed: false,

  subscribe: async () => {
    if (get().subscribed) return;

    const subscription = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        async (payload) => {
          // Show toast notification for status changes
          if (payload.eventType === 'UPDATE') {
            const oldStatus = (payload.old as any)?.status;
            const newStatus = (payload.new as any)?.status;
            
            if (oldStatus !== newStatus) {
              toast.info(`Order status updated to: ${newStatus.replace('_', ' ')}`);
            }
          }
          await get().loadOrders();
        }
      )
      .subscribe();

    set({ subscribed: true });
  },

  unsubscribe: () => {
    supabase.channel('orders-channel').unsubscribe();
    set({ subscribed: false });
  },

  loadOrders: async () => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ orders: data || [], loading: false });
    } catch (error) {
      console.error('Error loading orders:', error);
      set({ error: 'Failed to load orders', loading: false });
    }
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus, notes?: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state immediately for better UX
      set(state => ({
        orders: state.orders.map(order =>
          order.id === orderId
            ? { ...order, status, updated_at: new Date().toISOString() }
            : order
        )
      }));

      // Show success notification
      toast.success(`Order status updated to ${status.replace('_', ' ')}`);

      // Reload orders to ensure consistency
      await get().loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      throw error;
    }
  },

  getStatusHistory: async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('status_history')
        .select(`
          *,
          changed_by:profiles(full_name)
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading status history:', error);
      toast.error('Failed to load status history');
      return [];
    }
  },
}));
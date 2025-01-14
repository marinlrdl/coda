import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  PlusCircle, 
  Package, 
  Settings, 
  Users, 
  Music4, 
  Clock, 
  FileText, 
  Briefcase,
  Calendar,
  CheckCircle,
  UserPlus
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import StatusBadge from '../components/StatusBadge';

type Order = Database['public']['Tables']['orders']['Row'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, loadProfile } = useAuthStore();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!profile?.id) {
      loadProfile().catch(err => {
        console.error('Failed to load profile:', err);
        toast.error('Failed to load profile. Please try logging in again.');
        navigate('/login');
      });
      return;
    }

    loadOrders();
  }, [profile?.id, profile?.role, navigate, loadProfile]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('orders')
        .select('*');

      if (profile?.role === 'client') {
        query = query.eq('client_id', profile.id);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err as Error);
      toast.error('Failed to load orders. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="mt-2 text-lg font-medium text-gray-900">Error Loading Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto" />
        <h2 className="mt-2 text-lg font-medium text-gray-900">Session Expired</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please log in again to access your dashboard.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Log In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {profile?.role === 'admin' && (
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Users className="h-5 w-5 mr-2" />
              Manage Users
            </button>
            <button
              onClick={() => navigate('/admin/freelancers')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Manage Freelancers
            </button>
            <button
              onClick={() => navigate('/admin/projects')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Briefcase className="h-5 w-5 mr-2" />
              Manage Projects
            </button>
          </div>
        )}
      </div>

      {profile?.role === 'client' && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Dashboard stats cards */}
          </div>

          <div className="mt-8">
            <button
              onClick={() => navigate('/orders/new')}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              New Order
            </button>
          </div>

          {/* Order History Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
            
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No Orders Found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your completed orders will appear here.
                </p>
              </div>
            ) : (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr 
                          key={order.id}
                          onClick={() => handleRowClick(order.id)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {order.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {order.service_type === 'mixing' ? (
                                <span className="flex items-center">
                                  <Music4 className="h-4 w-4 mr-2" />
                                  Mixing
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mastering
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(order.id);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {profile?.role === 'admin' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">Total Orders</h3>
              <p className="mt-2 text-3xl font-bold text-indigo-600">
                {orders.length}
              </p>
            </div>
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">Active Orders</h3>
              <p className="mt-2 text-3xl font-bold text-indigo-600">
                {orders.filter(o => o.status !== 'completed').length}
              </p>
            </div>
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">Completed Orders</h3>
              <p className="mt-2 text-3xl font-bold text-indigo-600">
                {orders.filter(o => o.status === 'completed').length}
              </p>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.slice(0, 5).map((order) => (
                    <tr 
                      key={order.id}
                      onClick={() => handleRowClick(order.id)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.client_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(order.id);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

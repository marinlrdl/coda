import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Package, Settings, Users, Music4, Clock, FileText, Briefcase } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { toast } from 'sonner';

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

    async function loadOrders() {
      try {
        setLoading(true);
        setError(null);
        let query = supabase.from('orders').select('*');
        
        if (profile.role === 'client') {
          query = query.eq('client_id', profile.id);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        
        setOrders(data || []);
      } catch (err) {
        console.error('Error loading orders:', err);
        setError(err as Error);
        toast.error('Failed to load orders. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [profile?.id, profile?.role, navigate, loadProfile]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
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

  // Rest of your existing dashboard rendering code...
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {profile?.role === 'client' && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Active Orders</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {orders.filter(o => o.status !== 'completed').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center">
                <Settings className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {orders.filter(o => o.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">In Review</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {orders.filter(o => o.status === 'review').length}
                  </p>
                </div>
              </div>
            </div>
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
        </>
      )}

      {profile?.role === 'admin' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Total Orders</h3>
                  <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6 cursor-pointer" onClick={() => navigate('/admin/users')}>
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-600">Manage user accounts and roles</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6 cursor-pointer" onClick={() => navigate('/admin/projects')}>
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Project Management</h3>
                  <p className="text-sm text-gray-600">Track and assign projects</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white shadow-sm rounded-lg p-6 cursor-pointer" onClick={() => navigate('/admin/freelancers')}>
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Freelancer Management</h3>
                  <p className="text-sm text-gray-600">Manage external freelancers and assignments</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Active Projects</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {orders.filter(o => o.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
            </div>

            {orders.length === 0 ? (
              <div className="p-6 text-center text-gray-600">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-2">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.slice(0, 5).map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {order.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.service_type.charAt(0).toUpperCase() + order.service_type.slice(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
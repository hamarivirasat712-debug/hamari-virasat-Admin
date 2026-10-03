'use client';

import { useEffect, useState, useCallback } from 'react';

type Order = {
  id: string;
  created_at: string;
  customer_email: string;
  payment_id: string;
  order_id?: string;
  ritual_names?: string[];
  ritual_slugs?: string[];
  ritual_indices?: number[];
  status: 'pending' | 'in_progress' | 'delivered';
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  delivered: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  delivered: 'Delivered',
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/orders');
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders from database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(`Failed to update status: ${errData.error || 'Unknown error'}`);
        return;
      }
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as Order['status'] } : o));
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getRitualsList = (order: Order): string[] => {
    if (order.ritual_names && order.ritual_names.length > 0) {
      return order.ritual_names;
    }
    if (order.ritual_slugs && order.ritual_slugs.length > 0) {
      return order.ritual_slugs.map(s => s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    }
    return ['Ritual Documentation'];
  };

  const totalRevenue = orders.length * 501; // base price — est.

  return (
    <div>
      {/* Error notification */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={fetchOrders}
            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: orders.length, icon: '📋' },
          { label: 'Revenue (est.)', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: '₹' },
          { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: '✅' },
          { label: 'In Progress', value: orders.filter(o => o.status === 'in_progress').length, icon: '⏳' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#2A1208] border border-[#5E2E14] rounded-2xl p-5">
            <p className="text-[#5C564F] text-xs uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-white text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-[#2A1208] border border-[#5E2E14] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#5E2E14] flex items-center justify-between">
          <h2 className="text-white font-semibold flex items-center gap-2">
            Orders
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Connected to database" />
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[#5C564F] text-xs">{orders.length} total</span>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="text-[#C9A84C] hover:text-white bg-[#BD5319]/10 border border-[#BD5319]/30 hover:border-[#BD5319] text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-6 h-6 border-2 border-[#BD5319] border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#5C564F] text-sm">No orders yet. They will appear here after a customer completes payment on the website.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#5E2E14]">
                  {['Date', 'Email', 'Rituals', 'Payment ID', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left text-[#5C564F] text-xs uppercase tracking-wider px-6 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-[#5E2E14]/40 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-[#5C564F] whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-white font-medium">{order.customer_email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {getRitualsList(order).map((r, idx) => (
                          <span key={idx} className="text-xs bg-[#BD5319]/10 border border-[#BD5319]/20 text-[#C9A84C] px-2 py-0.5 rounded-full">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-[#5C564F] text-xs font-mono">{order.payment_id || order.order_id || '—'}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full border ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={e => updateStatus(order.id, e.target.value)}
                        className="bg-[#3E1A0C] border border-[#5E2E14] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#C9A84C]/50 cursor-pointer disabled:opacity-50"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note about analytics */}
      <div className="mt-6 bg-[#2A1208]/80 border border-[#5E2E14]/60 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">💡</span>
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-1">Website Analytics</h4>
            <p className="text-[#5C564F] text-xs leading-relaxed">
              To track visitor traffic and page views, connect Google Analytics or Plausible to your domain. Customer orders, intake submissions, and contact form enquiries are already logged live in this dashboard.
            </p>
          </div>
        </div>
        <a
          href="https://analytics.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[#C9A84C] hover:text-white bg-[#BD5319]/20 hover:bg-[#BD5319]/40 border border-[#BD5319]/40 px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap self-stretch sm:self-auto text-center"
        >
          Open Analytics ↗
        </a>
      </div>
    </div>
  );
}


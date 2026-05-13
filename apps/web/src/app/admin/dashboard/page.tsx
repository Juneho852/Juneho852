'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PortalLayout from '@/components/layout/portal-layout';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const NAV = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '🏠' },
  { label: 'Users', href: '/admin/users', icon: '👥' },
  { label: 'Payments', href: '/admin/payments', icon: '💳' },
  { label: 'Audit Logs', href: '/admin/audit', icon: '📋' },
  { label: 'Refunds', href: '/admin/refunds', icon: '↩️' },
];

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/users/admin/all')
      .then(r => setUsers(r.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const toggleUser = async (userId: string, isActive: boolean) => {
    try {
      await api.patch(`/users/admin/${userId}/status`, { isActive: !isActive });
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: !isActive } : u));
      toast.success(isActive ? 'User suspended' : 'User reactivated');
    } catch {
      toast.error('Action failed');
    }
  };

  const filtered = users.filter(u =>
    !filter || u.email.includes(filter) || u.role.includes(filter.toUpperCase())
  );

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <PortalLayout role="ADMIN" navItems={NAV}>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-sm text-amber-600 mb-8">⚠️ All admin actions are logged. MFA mandatory for this account.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {['EMPLOYER', 'HELPER', 'BROKER', 'ADMIN'].map(role => (
            <div key={role} className="card text-center">
              <div className="text-2xl font-bold text-gray-900">{roleCounts[role] || 0}</div>
              <div className="text-xs text-gray-500 capitalize">{role.toLowerCase()}s</div>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">All Users</h2>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="input w-64 text-sm"
              placeholder="Filter by email or role..."
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Created</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td className="py-3 pr-4 text-gray-900 font-mono text-xs">{u.email}</td>
                      <td className="py-3 pr-4">
                        <span className={`badge ${
                          u.role === 'EMPLOYER' ? 'bg-brand-100 text-brand-700' :
                          u.role === 'HELPER' ? 'bg-green-100 text-green-700' :
                          u.role === 'BROKER' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                      <td className="py-3">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => toggleUser(u.id, u.isActive)}
                            className={`text-xs px-2 py-1 rounded border ${
                              u.isActive
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {u.isActive ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}

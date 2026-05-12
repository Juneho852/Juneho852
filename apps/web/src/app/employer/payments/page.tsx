'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PortalLayout from '@/components/layout/portal-layout';
import { api } from '@/lib/api';
import { formatHkd, formatDate } from '@/lib/utils';

const NAV = [
  { label: 'Dashboard', href: '/employer/dashboard', icon: '🏠' },
  { label: 'Find Helpers', href: '/employer/search', icon: '🔍' },
  { label: 'My Jobs', href: '/employer/jobs', icon: '💼' },
  { label: 'Payments', href: '/employer/payments', icon: '💳' },
  { label: 'Contacts', href: '/employer/contacts', icon: '📞' },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  AUTHORIZED: 'bg-amber-100 text-amber-700',
  CAPTURED: 'bg-green-100 text-green-700',
  REFUNDED: 'bg-blue-100 text-blue-700',
  PARTIALLY_REFUNDED: 'bg-purple-100 text-purple-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments/my').then(r => setPayments(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <PortalLayout role="EMPLOYER" navItems={NAV}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <Link href="/employer/payment" className="btn-primary">+ New Payment</Link>
        </div>

        <div className="card">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💳</div>
              <p className="text-gray-500">No payments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Platform Fee</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="py-3 pr-4 font-medium">{formatHkd(p.amount)}</td>
                      <td className="py-3 pr-4 text-gray-500">{formatHkd(p.platformFee)}</td>
                      <td className="py-3 pr-4">
                        <span className={`badge ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-600'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-400 text-xs">{formatDate(p.createdAt)}</td>
                      <td className="py-3">
                        {p.status === 'CAPTURED' && (
                          <a
                            href={`/api/v1/documents/${p.id}/escrow-release`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-brand-600 hover:underline"
                          >
                            📄 Receipt
                          </a>
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

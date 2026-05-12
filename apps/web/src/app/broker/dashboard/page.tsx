'use client';
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import PortalLayout from '@/components/layout/portal-layout';
import { api } from '@/lib/api';
import { formatHkd, formatDate } from '@/lib/utils';

const NAV = [
  { label: 'Dashboard', href: '/broker/dashboard', icon: '🏠' },
  { label: 'My Helpers', href: '/broker/helpers', icon: '👥' },
  { label: 'Payouts', href: '/broker/payouts', icon: '💰' },
  { label: 'Documents', href: '/broker/documents', icon: '📄' },
  { label: 'Stripe Setup', href: '/broker/stripe', icon: '💳' },
];

export default function BrokerDashboard() {
  const [helpers, setHelpers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get('/users/broker/helpers')
      .then(r => setHelpers(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(Boolean);
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim());
        return headers.reduce((obj, h, i) => ({ ...obj, [h]: vals[i] }), {} as any);
      });

      const res = await api.post('/users/broker/helpers/bulk', { helpers: rows });
      toast.success(`Uploaded ${res.data.created} helpers`);
      const updated = await api.get('/users/broker/helpers');
      setHelpers(updated.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const connectStripe = async () => {
    try {
      const res = await api.post('/payments/broker/connect', {
        email: 'broker@example.com',
      });
      window.open(res.data.onboardingUrl, '_blank');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Stripe connect failed');
    }
  };

  const vettedCount = helpers.filter(h => h.isVetted).length;
  const visibleCount = helpers.filter(h => h.isProfileVisible).length;

  return (
    <PortalLayout role="BROKER" navItems={NAV}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Broker Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your helper pool and payouts</p>
          </div>
          <button onClick={connectStripe} className="btn-primary flex items-center gap-2">
            💳 Connect Stripe
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          {[
            { label: 'Total Helpers', value: helpers.length, icon: '👥', color: 'text-purple-600' },
            { label: 'Vetted', value: vettedCount, icon: '✅', color: 'text-green-600' },
            { label: 'Visible to Employers', value: visibleCount, icon: '👁️', color: 'text-brand-600' },
            { label: 'Pending Payout', value: 'HKD 0', icon: '💰', color: 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="card">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Payout Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-amber-800 mb-1">⏳ 30-Day Payout Hold</h3>
          <p className="text-sm text-amber-700">
            Platform payouts are held for 30 days after a helper is hired and visa is confirmed.
            This protects employers in case of early termination. After 30 days, funds are auto-transferred to your Stripe account.
          </p>
        </div>

        {/* Helper Pool */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Helper Pool</h2>
            <div className="flex gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className={`btn-primary text-sm cursor-pointer ${uploading ? 'opacity-50' : ''}`}
              >
                {uploading ? '⏳ Uploading...' : '📤 Bulk Upload CSV'}
              </label>
            </div>
          </div>

          <div className="text-xs text-gray-400 mb-4">
            CSV format: email, fullName, phone, nationality, yearsExperience, languages, cookingTypes
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : helpers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-500 mb-4">No helpers in your pool yet</p>
              <label htmlFor="csv-upload" className="btn-primary cursor-pointer">Upload CSV</label>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Nationality</th>
                    <th className="pb-3 pr-4">Experience</th>
                    <th className="pb-3 pr-4">AI Score</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Visible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {helpers.map(h => (
                    <tr key={h.id}>
                      <td className="py-3 pr-4 font-medium text-gray-900">{h.fullName}</td>
                      <td className="py-3 pr-4 text-gray-500">{h.nationality}</td>
                      <td className="py-3 pr-4 text-gray-500">{h.yearsExperience}yr</td>
                      <td className="py-3 pr-4">
                        {h.aiVettingScore ? (
                          <span className="text-green-600 font-medium">{h.aiVettingScore.toFixed(0)}/100</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`badge ${h.isVetted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {h.isVetted ? 'Vetted' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`badge ${h.isProfileVisible ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                          {h.isProfileVisible ? 'Visible' : 'Hidden'}
                        </span>
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

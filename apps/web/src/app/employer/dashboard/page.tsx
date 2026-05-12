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

export default function EmployerDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/jobs').then(r => setJobs(r.data)),
      api.get('/payments/my').then(r => setPayments(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const activeJobs = jobs.filter(j => j.status === 'ACTIVE').length;
  const totalSpent = payments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <PortalLayout role="EMPLOYER" navItems={NAV}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employer Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Find your perfect domestic helper</p>
          </div>
          <Link href="/employer/search" className="btn-primary flex items-center gap-2">
            <span>🔍</span> Find Helpers
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[
            { label: 'Active Job Posts', value: activeJobs, icon: '💼', color: 'text-brand-600' },
            { label: 'Total Spent', value: formatHkd(totalSpent), icon: '💳', color: 'text-green-600' },
            { label: 'Matches Found', value: jobs.filter(j => j.status === 'MATCHED').length, icon: '✅', color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="card">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Jobs */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Job Posts</h2>
            <Link href="/employer/jobs" className="text-brand-600 text-sm hover:underline">View all</Link>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-3">No job posts yet</p>
              <Link href="/employer/search" className="btn-primary text-sm">Post your first job</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map(job => (
                <div key={job.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{job.title}</div>
                    <div className="text-xs text-gray-400">{formatDate(job.createdAt)}</div>
                  </div>
                  <span className={`badge ${
                    job.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    job.status === 'MATCHED' ? 'bg-brand-100 text-brand-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">How MatchAI Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Post Requirements', desc: 'Tell us what you need — experience, languages, cooking types' },
              { step: '2', title: 'AI Matches', desc: 'GPT-4o scores 50+ helpers and ranks the top 10 for you' },
              { step: '3', title: 'Interview', desc: 'Contact helpers via masked proxy — real numbers never shared' },
              { step: '4', title: 'Hire Securely', desc: 'Pay via Stripe escrow — funds released only after visa confirms' },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-900">{s.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import PortalLayout from '@/components/layout/portal-layout';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const NAV = [
  { label: 'Dashboard', href: '/employer/dashboard', icon: '🏠' },
  { label: 'Find Helpers', href: '/employer/search', icon: '🔍' },
  { label: 'My Jobs', href: '/employer/jobs', icon: '💼' },
  { label: 'Payments', href: '/employer/payments', icon: '💳' },
  { label: 'Contacts', href: '/employer/contacts', icon: '📞' },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/jobs').then(r => setJobs(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <PortalLayout role="EMPLOYER" navItems={NAV}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Job Posts</h1>
          <Link href="/employer/search" className="btn-primary">+ New Job</Link>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-4xl mb-4">💼</div>
            <p className="text-gray-500 mb-4">No job posts yet</p>
            <Link href="/employer/search" className="btn-primary">Post your first job</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job.id} className="card flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <div className="text-xs text-gray-400 mt-1">
                    {job.yearsExpNeeded}yr exp • {job.numChildren} children • Budget HKD {job.budgetMin}–{job.budgetMax}
                  </div>
                  <div className="text-xs text-gray-400">{formatDate(job.createdAt)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${
                    job.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    job.status === 'HIRED' ? 'bg-brand-100 text-brand-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {job.status}
                  </span>
                  <Link
                    href={`/employer/search?jobId=${job.id}`}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    View Matches
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

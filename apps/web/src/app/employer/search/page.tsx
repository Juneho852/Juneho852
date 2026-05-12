'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PortalLayout from '@/components/layout/portal-layout';
import { api } from '@/lib/api';

const NAV = [
  { label: 'Dashboard', href: '/employer/dashboard', icon: '🏠' },
  { label: 'Find Helpers', href: '/employer/search', icon: '🔍' },
  { label: 'My Jobs', href: '/employer/jobs', icon: '💼' },
  { label: 'Payments', href: '/employer/payments', icon: '💳' },
  { label: 'Contacts', href: '/employer/contacts', icon: '📞' },
];

const NATIONALITIES = ['Filipino', 'Indonesian', 'Myanmar', 'Thai', 'Sri Lankan', 'Indian', 'No preference'];
const LANGUAGES = ['English', 'Cantonese', 'Mandarin', 'Tagalog', 'Bahasa Indonesia'];
const COOKING = ['Chinese', 'Western', 'Halal', 'Indian', 'Japanese'];

interface SearchForm {
  title: string;
  yearsExpNeeded: number;
  numChildren: number;
  numElderly: number;
  needsPetCare: boolean;
  needsDriving: boolean;
  nationalityPref: string;
  budgetMin: number;
  budgetMax: number;
}

export default function SearchPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [cooking, setCooking] = useState<string[]>([]);

  const { register, handleSubmit } = useForm<SearchForm>({
    defaultValues: { yearsExpNeeded: 2, numChildren: 1, numElderly: 0, budgetMin: 4000, budgetMax: 6000 },
  });

  const onSearch = async (data: SearchForm) => {
    setLoading(true);
    try {
      // Create the job first
      const jobRes = await api.post('/jobs', {
        ...data,
        languagesRequired: languages,
        cookingRequired: cooking,
      });
      const newJobId = jobRes.data.id;
      setJobId(newJobId);

      // Run AI matching
      const matchRes = await api.post('/matching/run', {
        ...data,
        jobId: newJobId,
        languagesRequired: languages,
        cookingRequired: cooking,
      });
      setResults(matchRes.data.results || []);
      toast.success(`Found ${matchRes.data.total} matches!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const requestContact = async (helperId: string) => {
    try {
      const res = await api.post('/communications/proxy', { helperId });
      toast.success(`Contact number: ${res.data.proxyNumber}`);
    } catch {
      toast.error('Could not get contact number');
    }
  };

  const toggleArr = (arr: string[], setArr: (a: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  return (
    <PortalLayout role="EMPLOYER" navItems={NAV}>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Find Your Helper</h1>
        <p className="text-gray-500 text-sm mb-8">Our AI will match helpers to your requirements</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Form */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Job Requirements</h2>
              <form onSubmit={handleSubmit(onSearch)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Job Title</label>
                  <input {...register('title', { required: true })} className="input" placeholder="Full-time Live-in Helper" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Min Years Exp.</label>
                    <input {...register('yearsExpNeeded')} type="number" min="0" className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Children</label>
                    <input {...register('numChildren')} type="number" min="0" className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Elderly</label>
                    <input {...register('numElderly')} type="number" min="0" className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nationality</label>
                    <select {...register('nationalityPref')} className="input">
                      {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Languages Needed</label>
                  <div className="flex flex-wrap gap-1.5">
                    {LANGUAGES.map(l => (
                      <button key={l} type="button"
                        onClick={() => toggleArr(languages, setLanguages, l)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          languages.includes(l) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'
                        }`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Cooking Types</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COOKING.map(c => (
                      <button key={c} type="button"
                        onClick={() => toggleArr(cooking, setCooking, c)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          cooking.includes(c) ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'
                        }`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input {...register('needsPetCare')} type="checkbox" className="rounded" />
                    Pet Care
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input {...register('needsDriving')} type="checkbox" className="rounded" />
                    Driving
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Budget Min (HKD)</label>
                    <input {...register('budgetMin')} type="number" className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Budget Max (HKD)</label>
                    <input {...register('budgetMax')} type="number" className="input" />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <span className="animate-spin">⚙️</span>
                      AI Matching...
                    </>
                  ) : (
                    <>🤖 Run AI Match</>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {results.length === 0 && !loading ? (
              <div className="card text-center py-16">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="font-medium text-gray-700 mb-2">Ready to Match</h3>
                <p className="text-gray-400 text-sm">Fill in your requirements and click "Run AI Match"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((r, idx) => (
                  <div key={r.helperId} className={`card ${r.isWildcard ? 'border-accent-500 border' : ''}`}>
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg">
                          {r.helper?.fullName?.[0] || '?'}
                        </div>
                        {idx < 3 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{r.helper?.fullName || 'Helper'}</h3>
                          {r.isWildcard && (
                            <span className="badge bg-accent-100 text-accent-600">✨ Wildcard</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {r.helper?.nationality} • {r.helper?.yearsExperience}yr exp • {r.helper?.languages?.join(', ')}
                        </div>

                        {/* Match Score Bar */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="score-bar h-full rounded-full" style={{ width: `${r.score}%` }} />
                          </div>
                          <span className="text-sm font-bold text-brand-600">{Math.round(r.score)}%</span>
                        </div>

                        <p className="text-xs text-gray-600 mb-3">{r.reasoning}</p>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => requestContact(r.helperId)}
                            className="btn-primary text-xs py-1.5 px-3"
                          >
                            📞 Get Contact
                          </button>
                          <button className="btn-secondary text-xs py-1.5 px-3">
                            📋 View Profile
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

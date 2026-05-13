'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import PortalLayout from '@/components/layout/portal-layout';
import { api } from '@/lib/api';

const NAV = [
  { label: 'Dashboard', href: '/helper/dashboard', icon: '🏠' },
  { label: 'My Profile', href: '/helper/profile', icon: '👤' },
  { label: 'Job Offers', href: '/helper/offers', icon: '💼' },
  { label: 'Interviews', href: '/helper/interviews', icon: '🎤' },
];

const LANGUAGES = ['English', 'Cantonese', 'Mandarin', 'Tagalog', 'Bahasa Indonesia'];
const COOKING = ['Chinese', 'Western', 'Halal', 'Indian', 'Japanese'];

export default function HelperDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [cooking, setCooking] = useState<string[]>([]);

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    api.get('/auth/me').then(res => {
      api.get(`/users/helpers/${res.data.userId}`).then(r => {
        setProfile(r.data);
        setLanguages(r.data.languages || []);
        setCooking(r.data.cookingTypes || []);
        reset(r.data);
      }).catch(() => setEditing(true));
    });
  }, []);

  const onSave = async (data: any) => {
    setSaving(true);
    try {
      const res = await api.patch('/users/helper/profile', {
        ...data,
        languages,
        cookingTypes: cooking,
      });
      setProfile(res.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleArr = (arr: string[], setArr: (a: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  };

  return (
    <PortalLayout role="HELPER" navItems={NAV}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Helper Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your profile and job offers</p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-secondary">
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* Vetting Status */}
        {profile && (
          <div className={`rounded-xl p-4 mb-6 ${profile.isVetted ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{profile.isVetted ? '✅' : '⏳'}</span>
              <div>
                <div className="font-medium text-gray-900">
                  {profile.isVetted ? 'Profile Vetted & Visible' : 'Pending AI Vetting'}
                </div>
                <div className="text-sm text-gray-500">
                  {profile.isVetted
                    ? `AI Vetting Score: ${profile.aiVettingScore?.toFixed(0)}/100 — Employers can find you`
                    : 'Complete your profile to be vetted by our AI system'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile / Edit Form */}
        <div className="card">
          {!editing ? (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-2xl">
                  {profile?.fullName?.[0] || '?'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{profile?.fullName}</h2>
                  <p className="text-gray-500 text-sm">{profile?.nationality} • {profile?.yearsExperience} years experience</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Languages</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile?.languages || []).map((l: string) => (
                      <span key={l} className="badge bg-emerald-100 text-emerald-700">{l}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Cooking</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile?.cookingTypes || []).map((c: string) => (
                      <span key={c} className="badge bg-blue-100 text-blue-700">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">Skills</div>
                  <div className="flex gap-2">
                    {profile?.hasPetCare && <span className="badge bg-purple-100 text-purple-700">Pet Care</span>}
                    {profile?.hasDriving && <span className="badge bg-orange-100 text-orange-700">Driving</span>}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase tracking-wide mb-1">MBTI</div>
                  <div className="text-gray-700">{profile?.mbtiType || 'Not set'}</div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
              <h2 className="font-semibold text-gray-900 mb-2">Edit Your Profile</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                  <input {...register('fullName')} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nationality</label>
                  <input {...register('nationality')} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Years Experience</label>
                  <input {...register('yearsExperience')} type="number" min="0" className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">MBTI Type</label>
                  <input {...register('mbtiType')} className="input" placeholder="e.g. ENFJ" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Children Experience (years)</label>
                  <input {...register('childrenExperience')} type="number" min="0" className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Elderly Experience (years)</label>
                  <input {...register('elderlyExperience')} type="number" min="0" className="input" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Languages</label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map(l => (
                    <button key={l} type="button"
                      onClick={() => toggleArr(languages, setLanguages, l)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        languages.includes(l) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200'
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
                        cooking.includes(c) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input {...register('hasPetCare')} type="checkbox" />
                  Pet Care
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input {...register('hasDriving')} type="checkbox" />
                  Driving License
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">🔒 Your Privacy is Protected</h3>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Your real phone number is AES-256 encrypted and never shown in the UI</li>
            <li>• Employers contact you via Twilio Proxy virtual numbers (same as Uber)</li>
            <li>• Your profile is only visible after AI vetting approval</li>
            <li>• You control whether to accept or decline interview invites</li>
          </ul>
        </div>
      </div>
    </PortalLayout>
  );
}

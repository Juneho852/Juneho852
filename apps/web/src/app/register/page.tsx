'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/auth-store';

type Role = 'EMPLOYER' | 'HELPER' | 'BROKER';

interface RegisterForm {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  nationality?: string;
  agencyName?: string;
  licenseNumber?: string;
}

const roleLabels: Record<Role, string> = {
  EMPLOYER: 'Employer (HK Family)',
  HELPER: 'Helper / Nanny',
  BROKER: 'Agency / Broker',
};

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('EMPLOYER');

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: { role: 'EMPLOYER' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser({ ...data, role: selectedRole });
      toast.success('Account created!');
      const map: Record<Role, string> = {
        EMPLOYER: '/employer/dashboard',
        HELPER: '/helper/dashboard',
        BROKER: '/broker/dashboard',
      };
      router.push(map[selectedRole]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-brand-600">MatchAI</Link>
          <p className="text-gray-500 mt-2 text-sm">Create your account</p>
        </div>

        <div className="card space-y-5">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
            <div className="grid grid-cols-3 gap-2">
              {(['EMPLOYER', 'HELPER', 'BROKER'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                    selectedRole === r
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                  }`}
                >
                  {roleLabels[r]}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input {...register('fullName', { required: true })} className="input" placeholder="Chan Tai Man" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...register('email', { required: true })} type="email" className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input {...register('password', { required: true, minLength: 8 })} type="password" className="input" placeholder="Min 8 characters" />
            </div>

            {selectedRole === 'HELPER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input {...register('nationality')} className="input" placeholder="e.g. Filipino, Indonesian" />
              </div>
            )}

            {selectedRole === 'BROKER' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
                  <input {...register('agencyName')} className="input" placeholder="ABC Employment Agency" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input {...register('licenseNumber')} className="input" placeholder="EAL-XXXXXX" />
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

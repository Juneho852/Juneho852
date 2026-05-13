'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/auth-store';

interface LoginForm { email: string; password: string }
interface MfaForm { token: string }

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyMfa } = useAuthStore();
  const [mfaStep, setMfaStep] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm<LoginForm>();
  const { register: regMfa, handleSubmit: handleMfa } = useForm<MfaForm>();

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.requiresMfa && result.userId) {
        setPendingUserId(result.userId);
        setMfaStep(true);
      } else {
        redirectByRole();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onMfa = async (data: MfaForm) => {
    setLoading(true);
    try {
      await verifyMfa(pendingUserId, data.token);
      redirectByRole();
    } catch {
      toast.error('Invalid MFA code');
    } finally {
      setLoading(false);
    }
  };

  const redirectByRole = () => {
    const role = useAuthStore.getState().role;
    const map: Record<string, string> = {
      EMPLOYER: '/employer/dashboard',
      HELPER: '/helper/dashboard',
      BROKER: '/broker/dashboard',
      ADMIN: '/admin/dashboard',
    };
    router.push(map[role!] || '/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-brand-600">MatchAI</Link>
          <p className="text-gray-500 mt-2 text-sm">Sign in to your account</p>
        </div>

        <div className="card">
          {!mfaStep ? (
            <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input {...register('email', { required: true })} type="email" className="input" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input {...register('password', { required: true })} type="password" className="input" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfa(onMfa)} className="space-y-4">
              <p className="text-sm text-gray-600">Enter your authenticator app code:</p>
              <input {...regMfa('token', { required: true })} className="input text-center text-2xl tracking-widest" placeholder="000000" maxLength={6} />
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link href="/register" className="text-brand-600 font-medium hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

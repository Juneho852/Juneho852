'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import PortalLayout from '@/components/layout/portal-layout';
import { api } from '@/lib/api';
import { formatHkd } from '@/lib/utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const NAV = [
  { label: 'Dashboard', href: '/employer/dashboard', icon: '🏠' },
  { label: 'Find Helpers', href: '/employer/search', icon: '🔍' },
  { label: 'My Jobs', href: '/employer/jobs', icon: '💼' },
  { label: 'Payments', href: '/employer/payments', icon: '💳' },
  { label: 'Contacts', href: '/employer/contacts', icon: '📞' },
];

function CheckoutForm({ amount }: { amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/employer/payment/success` },
      });
      if (error) toast.error(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-brand-50 rounded-lg p-4 border border-brand-100">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total amount (held in escrow)</span>
          <span className="font-bold text-brand-700 text-xl">{formatHkd(amount * 100)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Funds are authorized now but only captured after visa confirmation. Auto-released after 30 days if visa not confirmed.
        </p>
      </div>
      <PaymentElement />
      <button type="submit" disabled={loading || !stripe} className="btn-primary w-full text-base py-3">
        {loading ? 'Processing...' : `Pay ${formatHkd(amount * 100)} (Escrow)`}
      </button>
    </form>
  );
}

export default function PaymentPage() {
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState(5000);
  const [jobId, setJobId] = useState('');
  const [loading, setLoading] = useState(false);

  const initiatePayment = async () => {
    if (!jobId) { toast.error('Please select a job first'); return; }
    setLoading(true);
    try {
      const res = await api.post('/payments/intent', { jobId, amountHkd: amount });
      setClientSecret(res.data.clientSecret);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalLayout role="EMPLOYER" navItems={NAV}>
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure Payment</h1>
        <p className="text-gray-500 text-sm mb-8">Funds held in Stripe escrow until visa confirmation</p>

        {!clientSecret ? (
          <div className="card space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-medium text-amber-800 mb-1">How Escrow Works</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Your card is authorized (not charged) immediately</li>
                <li>• Funds captured only after visa confirmation</li>
                <li>• 30-day hold — auto-released if visa not confirmed</li>
                <li>• Prorated refund available if helper is dismissed mid-contract</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job ID</label>
              <input
                value={jobId}
                onChange={e => setJobId(e.target.value)}
                className="input"
                placeholder="Enter job ID from your job posts"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (HKD)</label>
              <input
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                type="number"
                className="input"
              />
            </div>
            <button onClick={initiatePayment} disabled={loading} className="btn-primary w-full">
              {loading ? 'Preparing...' : 'Continue to Payment'}
            </button>
          </div>
        ) : (
          <div className="card">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm amount={amount} />
            </Elements>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

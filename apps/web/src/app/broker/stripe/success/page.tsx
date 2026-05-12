'use client';
import Link from 'next/link';

export default function StripeSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card max-w-md text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Stripe Account Connected</h1>
        <p className="text-gray-500 text-sm mb-6">
          Your Stripe Express account has been set up. You'll receive automatic payouts 30 days after helper hire confirmation.
        </p>
        <Link href="/broker/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );
}

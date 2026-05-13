'use client';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card max-w-md text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Authorized</h1>
        <p className="text-gray-500 text-sm mb-4">
          Your payment has been authorized and held in escrow. Funds will only be captured after visa confirmation.
        </p>
        <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700 mb-6">
          <strong>Next steps:</strong> Our team will verify the visa application. Automatic payout to the broker happens 30 days after confirmation. If visa is not confirmed within 30 days, funds are released back to you.
        </div>
        <Link href="/employer/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );
}

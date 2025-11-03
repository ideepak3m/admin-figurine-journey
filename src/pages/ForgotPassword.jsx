import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!supabase) {
            setError('Supabase is not configured. Please add your credentials.');
            return;
        }

        setLoading(true);
        setError(null);

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (resetError) {
            setError(resetError.message);
        } else {
            setSuccess(true);
        }

        setLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="max-w-md w-full mx-4">
                    <div className="bg-card p-8 rounded-lg shadow-lg border border-border text-center">
                        <div className="mb-4">
                            <svg
                                className="mx-auto h-12 w-12 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 text-foreground">Check Your Email</h2>
                        <p className="text-muted-foreground mb-6">
                            We've sent a password reset link to <strong>{email}</strong>. Click the link in the
                            email to reset your password.
                        </p>
                        <a
                            href="/login"
                            className="inline-block py-2 px-6 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
                        >
                            Back to Sign In
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="max-w-md w-full mx-4">
                <div className="bg-card p-8 rounded-lg shadow-lg border border-border">
                    <h2 className="text-3xl font-bold mb-6 text-foreground text-center">Forgot Password</h2>
                    <p className="text-sm text-muted-foreground mb-6 text-center">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="you@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-md">
                            <p className="text-destructive text-sm">{error}</p>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <a href="/login" className="text-sm text-primary hover:underline">
                            Back to Sign In
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

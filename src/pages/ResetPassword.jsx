import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!supabase) {
            setError('Supabase is not configured.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        setError(null);

        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (updateError) {
            setError(updateError.message);
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
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-4 text-foreground">Password Reset Successful</h2>
                        <p className="text-muted-foreground mb-6">
                            Your password has been reset successfully. You can now sign in with your new password.
                        </p>
                        <a
                            href="/login"
                            className="inline-block py-2 px-6 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
                        >
                            Sign In
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
                    <h2 className="text-3xl font-bold mb-6 text-foreground text-center">Reset Password</h2>
                    <p className="text-sm text-muted-foreground mb-6 text-center">
                        Enter your new password below.
                    </p>

                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="••••••••"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Minimum 8 characters
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-md">
                            <p className="text-destructive text-sm">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

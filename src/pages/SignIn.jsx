import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSignIn = async (e) => {
        e.preventDefault();

        if (!supabase) {
            setError('Supabase is not configured. Please add your credentials.');
            return;
        }

        setLoading(true);
        setError(null);
        setMessage('');

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError(signInError.message);
        } else {
            // Check if user is approved
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('is_approved, role')
                .eq('id', data.user.id)
                .single();

            if (profileError) {
                setError('Error fetching user profile');
            } else if (!profile.is_approved && profile.role !== 'admin') {
                setMessage('Your account is pending approval. Please contact the administrator.');
                await supabase.auth.signOut();
            } else {
                setMessage('Sign in successful!');
                // Redirect to dashboard or home
                window.location.href = '/';
            }
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="max-w-md w-full mx-4">
                <div className="bg-card p-8 rounded-lg shadow-lg border border-border">
                    <h2 className="text-3xl font-bold mb-6 text-foreground text-center">Sign In</h2>

                    <form onSubmit={handleSignIn} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-md">
                            <p className="text-destructive text-sm">{error}</p>
                        </div>
                    )}

                    {message && (
                        <div className="mt-4 p-3 bg-primary/10 border border-primary rounded-md">
                            <p className="text-primary text-sm">{message}</p>
                        </div>
                    )}

                    <div className="mt-6 text-center space-y-2">
                        <a href="/forgot-password" className="block text-sm text-primary hover:underline">
                            Forgot password?
                        </a>
                        <p className="text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <a href="/register" className="text-primary hover:underline">
                                Request Access
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

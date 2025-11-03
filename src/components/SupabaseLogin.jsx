import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function SupabaseLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!supabase) {
            setError('Supabase credentials not configured. Please add your credentials to the .env file.');
            return;
        }

        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
        setLoading(false);
    };

    if (!supabase) {
        return (
            <div className="max-w-sm mx-auto my-8 p-6 bg-card rounded-lg shadow-lg border border-border">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Login with Supabase</h2>
                <div className="text-muted-foreground text-sm">
                    <p className="mb-2">⚠️ Supabase credentials not configured.</p>
                    <p>Create a <code className="bg-muted px-1 py-0.5 rounded">.env</code> file with:</p>
                    <pre className="bg-muted p-3 rounded mt-2 text-xs overflow-x-auto">
                        {`VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key`}
                    </pre>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleLogin} className="max-w-sm mx-auto my-8 p-6 bg-card rounded-lg shadow-lg border border-border">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Login with Supabase</h2>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="block w-full mb-4 px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="block w-full mb-4 px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
                {loading ? 'Logging in...' : 'Login'}
            </button>
            {error && <div className="text-destructive mt-4 text-sm">{error}</div>}
        </form>
    );
}

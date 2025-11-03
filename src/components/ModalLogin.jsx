import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpg';

export default function ModalLogin({ onClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    const { signIn, resetPassword } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await signIn(email, password);
            onClose();
        } catch (err) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await resetPassword(resetEmail);
            setResetSuccess(true);
        } catch (err) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    // Prevent closing modal when user is not authenticated
    const handleClose = () => {
        const { user } = useAuth();
        if (user) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
        }}>
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 w-full max-w-md relative">
                {/* Logo */}
                <div className="text-center mb-6">
                    <img
                        src={logo}
                        alt="FigureIt Admin Logo"
                        className="mx-auto h-20 w-auto mb-4"
                    />
                    <h2 className="text-2xl font-bold text-gray-900">
                        FigureIt Admin
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {showReset ? 'Reset your password' : 'Sign in to your account'}
                    </p>
                </div>

                {!showReset ? (
                    <>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}
                        <div className="mt-6 text-center">
                            <button
                                className="text-sm text-blue-600 hover:underline"
                                onClick={() => setShowReset(true)}
                            >
                                Forgot password?
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {!resetSuccess ? (
                            <form onSubmit={handleReset} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                                    <input
                                        type="email"
                                        value={resetEmail}
                                        onChange={e => setResetEmail(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center">
                                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                                    <p className="text-green-700 font-medium">Reset link sent!</p>
                                    <p className="text-green-600 text-sm mt-1">Check your email inbox.</p>
                                </div>
                                <button
                                    className="py-2 px-6 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                                    onClick={() => {
                                        setShowReset(false);
                                        setResetSuccess(false);
                                    }}
                                >
                                    Back to Sign In
                                </button>
                            </div>
                        )}
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}
                        {!resetSuccess && (
                            <div className="mt-6 text-center">
                                <button
                                    className="text-sm text-blue-600 hover:underline"
                                    onClick={() => setShowReset(false)}
                                >
                                    Back to Sign In
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

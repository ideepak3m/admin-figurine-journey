import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ChangePassword() {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (!supabase) {
            setError('Supabase is not configured.');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (formData.newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (formData.newPassword === formData.currentPassword) {
            setError('New password must be different from current password');
            return;
        }

        setLoading(true);
        setError(null);

        // Verify current password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: (await supabase.auth.getUser()).data.user?.email || '',
            password: formData.currentPassword,
        });

        if (signInError) {
            setError('Current password is incorrect');
            setLoading(false);
            return;
        }

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
            password: formData.newPassword,
        });

        if (updateError) {
            setError(updateError.message);
        } else {
            setSuccess(true);
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="max-w-md w-full mx-4">
                <div className="bg-card p-8 rounded-lg shadow-lg border border-border">
                    <h2 className="text-3xl font-bold mb-6 text-foreground text-center">Change Password</h2>
                    <p className="text-sm text-muted-foreground mb-6 text-center">
                        Update your password to something secure and memorable.
                    </p>

                    {success && (
                        <div className="mb-6 p-4 bg-primary/10 border border-primary rounded-md">
                            <p className="text-primary text-sm font-medium text-center">
                                ✓ Password changed successfully!
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
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
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
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
                            {loading ? 'Changing Password...' : 'Change Password'}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-md">
                            <p className="text-destructive text-sm">{error}</p>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <a href="/" className="text-sm text-primary hover:underline">
                            Back to Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

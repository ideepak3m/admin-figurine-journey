import React, { useState } from 'react';
import { supabaseAdmin } from '../supabaseClient';

export default function CreateUser() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        tempPassword: '',
        role: 'user',
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

    const generateTempPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, tempPassword: password });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        if (!supabaseAdmin) {
            setError('Supabase Admin is not configured. Please add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file.');
            return;
        }

        setLoading(true);
        setError(null);

        // Create user with admin privileges (requires service_role)
        const { data, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email: formData.email,
            password: formData.tempPassword,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: formData.fullName,
                role: formData.role,
                is_approved: true,
            },
        });

        if (signUpError) {
            setError(signUpError.message);
        } else {
            setSuccess(true);
            // Optionally send email with temp password
            alert(`User created successfully!\nEmail: ${formData.email}\nTemporary Password: ${formData.tempPassword}\n\nPlease save this password and share it securely with the user.`);
        }

        setLoading(false);
    };

    const resetForm = () => {
        setFormData({
            fullName: '',
            email: '',
            tempPassword: '',
            role: 'user',
        });
        setSuccess(false);
        setError(null);
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-card p-8 rounded-lg shadow-lg border border-border">
                <h2 className="text-2xl font-bold mb-6 text-foreground">Create New User</h2>
                <p className="text-sm text-muted-foreground mb-6">
                    Create a new user account with a temporary password. The user can change their password after first login.
                </p>

                {success ? (
                    <div className="text-center space-y-4">
                        <div className="p-4 bg-primary/10 border border-primary rounded-md">
                            <svg
                                className="mx-auto h-12 w-12 text-primary mb-2"
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
                            <p className="text-primary font-medium">User created successfully!</p>
                        </div>
                        <div className="p-4 bg-muted rounded-md text-left">
                            <p className="text-sm font-medium text-foreground mb-2">User Details:</p>
                            <p className="text-sm text-muted-foreground">Email: <strong>{formData.email}</strong></p>
                            <p className="text-sm text-muted-foreground">Temporary Password: <strong>{formData.tempPassword}</strong></p>
                            <p className="text-sm text-destructive mt-2">⚠️ Make sure to save this password - it won't be shown again!</p>
                        </div>
                        <button
                            onClick={resetForm}
                            className="py-2 px-6 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
                        >
                            Create Another User
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                placeholder="user@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Temporary Password
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="tempPassword"
                                    value={formData.tempPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                    className="flex-1 px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="Enter or generate password"
                                />
                                <button
                                    type="button"
                                    onClick={generateTempPassword}
                                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                                >
                                    Generate
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Minimum 8 characters. User will be prompted to change this on first login.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {loading ? 'Creating User...' : 'Create User'}
                        </button>
                    </form>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-md">
                        <p className="text-destructive text-sm">{error}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Note: Creating users requires admin privileges. Make sure you're logged in as an admin.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

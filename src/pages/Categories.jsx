import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Categories() {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setMessage({ type: 'error', text: 'Failed to load categories' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!newCategory.trim()) {
            setMessage({ type: 'error', text: 'Please enter a category name' });
            return;
        }

        // Check for duplicate
        const duplicate = categories.find(
            cat => cat.category.toLowerCase() === newCategory.trim().toLowerCase()
        );
        if (duplicate) {
            setMessage({ type: 'error', text: 'This category already exists' });
            return;
        }

        setSubmitting(true);

        try {
            console.log('Attempting to insert category:', { user_id: user.id, category: newCategory.trim() });

            const { data, error } = await supabase
                .from('categories')
                .insert({
                    user_id: user.id,
                    category: newCategory.trim()
                })
                .select();

            console.log('Insert result:', { data, error });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Category created successfully!' });
            setNewCategory('');

            // Refresh categories list
            await fetchCategories();
        } catch (error) {
            console.error('Error creating category:', error);
            console.error('Error details:', { message: error.message, hint: error.hint, details: error.details });
            setMessage({
                type: 'error',
                text: error.message || 'Failed to create category. Please try again.'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Manage Categories</h1>

            {/* Create Category Form */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Create New Category</h2>
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Enter category name"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={submitting}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`px-6 py-2 rounded font-semibold text-white ${submitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {submitting ? 'Adding...' : 'Add Category'}
                    </button>
                </form>

                {/* Message */}
                {message.text && (
                    <div className={`mt-4 p-3 rounded ${message.type === 'error'
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-green-100 text-green-700 border border-green-300'
                        }`}>
                        {message.text}
                    </div>
                )}
            </div>

            {/* Categories List */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Existing Categories</h2>

                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading categories...</div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No categories found. Create your first category above.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created At
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories.map((category) => (
                                    <tr key={category.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {category.category}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(category.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function ManageAssets() {
    const { user } = useAuth();
    const [assets, setAssets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [editingCategories, setEditingCategories] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [filterType, setFilterType] = useState('all'); // all, image, video

    useEffect(() => {
        if (user) {
            fetchAssets();
            fetchCategories();
        }
    }, [filterType, user]);

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('id, category')
            .order('category', { ascending: true });
        if (!error && data) {
            setCategories(data);
        }
    };

    const fetchAssets = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            let query = supabase
                .from('assets')
                .select(`
                    *,
                    asset_categories (
                        category_id,
                        categories (
                            id,
                            category
                        )
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (filterType !== 'all') {
                query = query.eq('asset_type', filterType);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Transform the data to include categories array and signed URLs
            const assetsWithCategories = await Promise.all(data.map(async (asset) => {
                // Extract file path from asset_url
                const urlParts = asset.asset_url.split('/');
                const filePath = urlParts.slice(-2).join('/'); // user_id/filename

                // Generate signed URL (valid for 1 hour)
                const { data: signedData, error: signedError } = await supabase.storage
                    .from('FigureIt_Assets')
                    .createSignedUrl(filePath, 3600); // 3600 seconds = 1 hour

                return {
                    ...asset,
                    asset_url: signedError ? asset.asset_url : signedData.signedUrl,
                    categories: asset.asset_categories
                        .map(ac => ac.categories)
                        .filter(c => c !== null)
                };
            }));

            setAssets(assetsWithCategories);
        } catch (error) {
            console.error('Error fetching assets:', error);
            setMessage({ type: 'error', text: 'Failed to load assets' });
        } finally {
            setLoading(false);
        }
    };

    const handleEditCategories = (asset) => {
        setSelectedAsset(asset);
        setEditingCategories(true);
        setSelectedCategories(asset.categories.map(c => c.id));
        setMessage({ type: '', text: '' });
    };

    const handleToggleCategory = (categoryId) => {
        setSelectedCategories(prev => {
            const isSelected = prev.includes(categoryId);
            return isSelected
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId];
        });
    };

    const handleSaveCategories = async () => {
        if (!selectedAsset) return;

        try {
            // Get current category associations
            const currentCategoryIds = selectedAsset.categories.map(c => c.id);

            // Determine what to add and remove
            const toAdd = selectedCategories.filter(id => !currentCategoryIds.includes(id));
            const toRemove = currentCategoryIds.filter(id => !selectedCategories.includes(id));

            // Remove categories
            if (toRemove.length > 0) {
                const { error: deleteError } = await supabase
                    .from('asset_categories')
                    .delete()
                    .eq('asset_id', selectedAsset.id)
                    .in('category_id', toRemove);

                if (deleteError) throw deleteError;
            }

            // Add categories
            if (toAdd.length > 0) {
                const inserts = toAdd.map(categoryId => ({
                    asset_id: selectedAsset.id,
                    category_id: categoryId
                }));

                const { error: insertError } = await supabase
                    .from('asset_categories')
                    .insert(inserts);

                if (insertError) throw insertError;
            }

            setMessage({ type: 'success', text: 'Categories updated successfully!' });
            setEditingCategories(false);
            setSelectedCategories([]);
            await fetchAssets(); // Refresh the list
        } catch (error) {
            console.error('Error updating categories:', error);
            setMessage({ type: 'error', text: 'Failed to update categories' });
        }
    };

    const handleDeleteAsset = async (asset) => {
        if (!confirm(`Are you sure you want to delete "${asset.title}"? This cannot be undone.`)) {
            return;
        }

        try {
            // Delete from storage
            const filePath = asset.asset_url.split('/').slice(-2).join('/'); // Extract user_id/filename
            const { error: storageError } = await supabase.storage
                .from('FigureIt_Assets')
                .remove([filePath]);

            if (storageError) {
                console.error('Storage deletion error:', storageError);
                // Continue anyway - database cleanup is more important
            }

            // Delete from database (will cascade delete asset_categories)
            const { error: dbError } = await supabase
                .from('assets')
                .delete()
                .eq('id', asset.id);

            if (dbError) throw dbError;

            setMessage({ type: 'success', text: 'Asset deleted successfully!' });
            await fetchAssets();
            // Clear selection if deleted asset was selected
            if (selectedAsset?.id === asset.id) {
                setSelectedAsset(null);
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
            setMessage({ type: 'error', text: 'Failed to delete asset' });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Loading assets...</p>
            </div>
        );
    }

    return (
        <div className="max-w-full h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Manage Assets</h1>

                {/* Filter */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-2 rounded ${filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        All ({assets.length})
                    </button>
                    <button
                        onClick={() => setFilterType('image')}
                        className={`px-4 py-2 rounded ${filterType === 'image' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        Images
                    </button>
                    <button
                        onClick={() => setFilterType('video')}
                        className={`px-4 py-2 rounded ${filterType === 'video' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        Videos
                    </button>
                </div>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`mb-4 p-3 rounded ${message.type === 'error'
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-green-100 text-green-700 border border-green-300'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Main Layout: Table + Preview */}
            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Left: Assets Table */}
                <div className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
                    <div className="overflow-auto flex-1">
                        {assets.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No assets found. Upload some images or videos to get started!</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {assets.map((asset) => (
                                        <tr
                                            key={asset.id}
                                            onClick={() => setSelectedAsset(asset)}
                                            className={`cursor-pointer hover:bg-blue-50 transition-colors ${selectedAsset?.id === asset.id ? 'bg-blue-100' : ''
                                                }`}
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <i className={`${asset.asset_type === 'image' ? 'fas fa-image text-blue-600' : 'fas fa-video text-purple-600'}`}></i>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{asset.title}</div>
                                                {asset.description && (
                                                    <div className="text-xs text-gray-500 truncate max-w-xs">{asset.description}</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {asset.categories.length > 0 ? (
                                                        asset.categories.slice(0, 2).map(cat => (
                                                            <span key={cat.id} className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                                                {cat.category}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No categories</span>
                                                    )}
                                                    {asset.categories.length > 2 && (
                                                        <span className="text-xs text-gray-500">+{asset.categories.length - 2}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded ${asset.asset_status === 'sold' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                    {asset.asset_status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                {asset.price ? `$${asset.price}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                                {new Date(asset.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right: Preview Panel */}
                <div className="w-96 bg-white rounded-lg shadow overflow-hidden flex flex-col">
                    {selectedAsset ? (
                        <>
                            {/* Preview */}
                            <div className="bg-gray-900 flex items-center justify-center p-4" style={{ height: '250px' }}>
                                {selectedAsset.asset_type === 'image' ? (
                                    <img
                                        src={selectedAsset.asset_url}
                                        alt={selectedAsset.title}
                                        className="max-w-full max-h-full object-contain"
                                        onError={(e) => {
                                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="50%" y="50%" text-anchor="middle" fill="white">Image not found</text></svg>';
                                        }}
                                    />
                                ) : (
                                    <video
                                        src={selectedAsset.asset_url}
                                        className="max-w-full max-h-full object-contain"
                                        controls
                                    />
                                )}
                            </div>

                            {/* Details */}
                            <div className="p-4 flex-1 overflow-auto">
                                <h3 className="text-lg font-bold mb-2">{selectedAsset.title}</h3>

                                {selectedAsset.description && (
                                    <p className="text-sm text-gray-600 mb-3">{selectedAsset.description}</p>
                                )}

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Type:</span>
                                        <span className="font-medium">{selectedAsset.asset_type}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Status:</span>
                                        <span className={`px-2 py-0.5 text-xs rounded ${selectedAsset.asset_status === 'sold' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {selectedAsset.asset_status}
                                        </span>
                                    </div>
                                    {selectedAsset.price && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Price:</span>
                                            <span className="font-semibold">${selectedAsset.price}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Uploaded:</span>
                                        <span>{new Date(selectedAsset.created_at).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Categories</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAsset.categories.length > 0 ? (
                                            selectedAsset.categories.map(cat => (
                                                <span key={cat.id} className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                                    {cat.category}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-400">No categories assigned</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleEditCategories(selectedAsset)}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                                    >
                                        <i className="fas fa-edit mr-2"></i>
                                        Edit Categories
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAsset(selectedAsset)}
                                        className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                                    >
                                        <i className="fas fa-trash mr-2"></i>
                                        Delete Asset
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <i className="fas fa-mouse-pointer text-4xl mb-2"></i>
                                <p>Select an asset to preview</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Categories Modal */}
            {editingCategories && selectedAsset && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">Edit Categories</h2>
                            <p className="text-gray-600 mb-4">Asset: <strong>{selectedAsset.title}</strong></p>

                            {/* Category Checkboxes */}
                            <div className="space-y-2 mb-6">
                                {categories.map((cat) => (
                                    <label
                                        key={cat.id}
                                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(cat.id)}
                                            onChange={() => handleToggleCategory(cat.id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="ml-2">{cat.category}</span>
                                    </label>
                                ))}
                            </div>

                            {selectedCategories.length === 0 && (
                                <p className="text-sm text-red-600 mb-4">⚠️ Please select at least one category</p>
                            )}

                            {/* Modal Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSaveCategories}
                                    disabled={selectedCategories.length === 0}
                                    className={`flex-1 px-4 py-2 rounded font-semibold text-white ${selectedCategories.length === 0
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingCategories(false);
                                        setSelectedCategories([]);
                                        setMessage({ type: '', text: '' });
                                    }}
                                    className="px-4 py-2 bg-gray-300 rounded font-semibold hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

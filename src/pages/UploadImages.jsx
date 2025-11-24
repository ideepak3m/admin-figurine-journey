import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function UploadImages() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        file: null,
        filename: '',
        status: 'inventory',
        selectedCategories: [],
        title: '',
        description: '',
        price: '',
        discounted_price: ''
    });
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [categories, setCategories] = useState([]);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('id, category')
            .order('created_at', { ascending: true });
        if (!error && data) {
            setCategories(data);
        }
    };
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setMessage({ type: 'error', text: 'Please select an image file' });
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'File size must be less than 10MB' });
                return;
            }

            setFormData({ ...formData, file, filename: file.name });

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
            setMessage({ type: '', text: '' });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleCategoryChange = (e) => {
        if (e.target.value === '__add__') {
            setShowAddCategory(true);
        } else {
            // Toggle category selection
            const categoryId = e.target.value;
            setFormData(prev => {
                const isSelected = prev.selectedCategories.includes(categoryId);
                return {
                    ...prev,
                    selectedCategories: isSelected
                        ? prev.selectedCategories.filter(id => id !== categoryId)
                        : [...prev.selectedCategories, categoryId]
                };
            });
        }
    };

    const removeCategory = (categoryId) => {
        setFormData(prev => ({
            ...prev,
            selectedCategories: prev.selectedCategories.filter(id => id !== categoryId)
        }));
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        setAddingCategory(true);

        try {
            console.log('Adding category:', { user_id: user.id, category: newCategory.trim() });

            const { data, error } = await supabase
                .from('categories')
                .insert({ user_id: user.id, category: newCategory.trim() })
                .select();

            console.log('Add category result:', { data, error });

            if (error) {
                console.error('Error adding category:', error);
                setMessage({ type: 'error', text: `Failed to add category: ${error.message}` });
            } else {
                setNewCategory('');
                setShowAddCategory(false);
                await fetchCategories();
                // Auto-select the newly added category
                if (data && data[0]) {
                    setFormData(prev => ({
                        ...prev,
                        selectedCategories: [...prev.selectedCategories, data[0].id]
                    }));
                }
                setMessage({ type: 'success', text: 'Category added successfully!' });
            }
        } catch (err) {
            console.error('Exception adding category:', err);
            setMessage({ type: 'error', text: 'Failed to add category. Please try again.' });
        } finally {
            setAddingCategory(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        // Validate required fields
        if (!formData.file) {
            setMessage({ type: 'error', text: 'Please select an image file' });
            return;
        }
        if (!formData.title) {
            setMessage({ type: 'error', text: 'Please enter a display title' });
            return;
        }
        if (formData.selectedCategories.length === 0) {
            setMessage({ type: 'error', text: 'Please select at least one category' });
            return;
        }

        setUploading(true);

        try {
            // Create unique filename with timestamp
            const fileExt = formData.file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}_${formData.filename.replace(/\s+/g, '_')}`;
            const filePath = `${fileName}`;

            // Upload file to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('FigureIt_Assets')
                .upload(filePath, formData.file);

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('FigureIt_Assets')
                .getPublicUrl(filePath);

            // Insert asset metadata into database
            const { data: assetData, error: dbError } = await supabase
                .from('assets')
                .insert({
                    user_id: user.id,
                    filename: formData.filename,
                    asset_type: 'image',
                    asset_status: formData.status,
                    title: formData.title,
                    description: formData.description,
                    price: formData.price ? parseFloat(formData.price) : null,
                    discounted_price: formData.discounted_price ? parseFloat(formData.discounted_price) : null,
                    asset_url: urlData.publicUrl
                })
                .select()
                .single();

            if (dbError) {
                // If database insert fails, try to delete the uploaded file
                await supabase.storage.from('FigureIt_Assets').remove([filePath]);
                throw dbError;
            }

            // Insert asset-category associations
            const assetCategoryInserts = formData.selectedCategories.map(categoryId => ({
                asset_id: assetData.id,
                category_id: categoryId
            }));

            const { error: categoryError } = await supabase
                .from('asset_categories')
                .insert(assetCategoryInserts);

            if (categoryError) {
                console.error('Error linking categories:', categoryError);
                // Note: Asset is already created, just log the error
                setMessage({ type: 'warning', text: 'Image uploaded but some categories failed to link.' });
            } else {
                setMessage({ type: 'success', text: 'Image uploaded successfully!' });
            }

            // Reset form
            setFormData({
                file: null,
                filename: '',
                status: 'inventory',
                selectedCategories: [],
                title: '',
                description: '',
                price: '',
                discounted_price: ''
            });
            setPreview(null);

            // Reset file input
            e.target.reset();

        } catch (error) {
            console.error('Upload error:', error);
            setMessage({
                type: 'error',
                text: error.message || 'Failed to upload image. Please try again.'
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Upload Image</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
                <div className="grid grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div>
                        {/* File Upload */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Choose File *
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                disabled={uploading}
                            />
                        </div>

                        {/* Filename */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filename
                            </label>
                            <input
                                type="text"
                                name="filename"
                                value={formData.filename}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={uploading}
                                placeholder="Automatically filled from file"
                            />
                        </div>

                        {/* Status */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status *
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={uploading}
                            >
                                <option value="inventory">Inventory</option>
                                <option value="sold">Sold</option>
                            </select>
                        </div>

                        {/* Category Multi-Select with Add Option */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Categories *
                            </label>

                            {/* Selected Categories Display */}
                            {formData.selectedCategories.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formData.selectedCategories.map(catId => {
                                        const category = categories.find(c => c.id === catId);
                                        return category ? (
                                            <span
                                                key={catId}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                                            >
                                                {category.category}
                                                <button
                                                    type="button"
                                                    onClick={() => removeCategory(catId)}
                                                    className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            )}

                            {/* Category Dropdown */}
                            <select
                                onChange={handleCategoryChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={uploading}
                                value=""
                            >
                                <option value="" disabled>Select categories...</option>
                                {categories.map((cat) => (
                                    <option
                                        key={cat.id}
                                        value={cat.id}
                                        disabled={formData.selectedCategories.includes(cat.id)}
                                    >
                                        {cat.category} {formData.selectedCategories.includes(cat.id) ? '✓' : ''}
                                    </option>
                                ))}
                                <option value="__add__">+ Add Category</option>
                            </select>

                            {/* Inline Add Category */}
                            {showAddCategory && (
                                <div className="flex mt-2 gap-2">
                                    <input
                                        type="text"
                                        value={newCategory}
                                        onChange={e => setNewCategory(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="New category name"
                                        disabled={addingCategory}
                                        autoFocus
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddCategory(e);
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCategory}
                                        disabled={addingCategory}
                                        className={`px-4 py-2 rounded font-semibold text-white ${addingCategory ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                                    >
                                        {addingCategory ? 'Adding...' : 'Add'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddCategory(false);
                                            setNewCategory('');
                                        }}
                                        className="px-4 py-2 rounded font-semibold bg-gray-300 hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Description */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full h-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                disabled={uploading}
                                placeholder="Enter a detailed description"
                                style={{ minHeight: '225px' }}
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col">
                        {/* Image Preview */}
                        <div className="mb-4 flex-shrink-0">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Image Preview
                            </label>
                            <div className="border border-gray-300 rounded bg-gray-50 flex items-center justify-center" style={{ minHeight: '200px' }}>
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="max-w-full h-auto max-h-96 rounded"
                                    />
                                ) : (
                                    <p className="text-gray-400">No image selected</p>
                                )}
                            </div>
                        </div>

                        {/* Display Title */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Display Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={uploading}
                                required
                                placeholder="Enter a descriptive title"
                            />
                        </div>

                        {/* Price */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Price (CAD)
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={uploading}
                                placeholder="0.00"
                            />
                        </div>

                        {/* Discounted Price */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Discounted Price (CAD)
                            </label>
                            <input
                                type="number"
                                name="discounted_price"
                                value={formData.discounted_price}
                                onChange={handleInputChange}
                                step="0.01"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={uploading}
                                placeholder="0.00"
                            />
                        </div>

                    </div>
                </div>

                {/* Message */}
                {message.text && (
                    <div className={`mt-4 p-3 rounded ${message.type === 'error'
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-green-100 text-green-700 border border-green-300'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={uploading}
                    className={`w-full mt-6 py-2 px-4 rounded font-semibold text-white ${uploading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
            </form>
        </div>
    );
}

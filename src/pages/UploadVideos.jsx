import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function UploadVideos() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        file: null,
        filename: '',
        status: 'inventory',
        category: 'FigureIt',
        title: '',
        description: '',
        price: ''
    });
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('video/')) {
                setMessage({ type: 'error', text: 'Please select a video file' });
                return;
            }

            // Validate file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'File size must be less than 50MB' });
                return;
            }

            setFormData({ ...formData, file, filename: file.name });

            // Create preview
            const videoURL = URL.createObjectURL(file);
            setPreview(videoURL);
            setMessage({ type: '', text: '' });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        // Validate required fields
        if (!formData.file) {
            setMessage({ type: 'error', text: 'Please select a video file' });
            return;
        }
        if (!formData.title) {
            setMessage({ type: 'error', text: 'Please enter a display title' });
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
            const { error: dbError } = await supabase
                .from('assets')
                .insert({
                    user_id: user.id,
                    filename: formData.filename,
                    asset_type: 'video',
                    asset_status: formData.status,
                    category: formData.category,
                    title: formData.title,
                    description: formData.description,
                    price: formData.price ? parseFloat(formData.price) : null,
                    asset_url: urlData.publicUrl
                });

            if (dbError) {
                // If database insert fails, try to delete the uploaded file
                await supabase.storage.from('FigureIt_Assets').remove([filePath]);
                throw dbError;
            }

            setMessage({ type: 'success', text: 'Video uploaded successfully!' });

            // Reset form
            setFormData({
                file: null,
                filename: '',
                status: 'inventory',
                category: 'FigureIt',
                title: '',
                description: '',
                price: ''
            });

            // Revoke the preview URL
            if (preview) {
                URL.revokeObjectURL(preview);
            }
            setPreview(null);

            // Reset file input
            e.target.reset();

        } catch (error) {
            console.error('Upload error:', error);
            setMessage({
                type: 'error',
                text: error.message || 'Failed to upload video. Please try again.'
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Upload Video</h1>

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
                                accept="video/*"
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

                        {/* Category */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category *
                            </label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={uploading}
                                required
                            />
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
                        {/* Video Preview */}
                        <div className="mb-4 flex-shrink-0">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Video Preview
                            </label>
                            <div className="border border-gray-300 rounded bg-gray-50 flex items-center justify-center" style={{ minHeight: '200px' }}>
                                {preview ? (
                                    <video
                                        src={preview}
                                        controls
                                        className="max-w-full h-auto max-h-96 rounded"
                                    />
                                ) : (
                                    <p className="text-gray-400">No video selected</p>
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
                    {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
            </form>
        </div>
    );
}

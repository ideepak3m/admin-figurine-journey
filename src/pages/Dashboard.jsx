import React from 'react';
export default function Dashboard() {
    return (
        <div className="space-y-6 p-4">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600">Welcome to FigureIt Admin Dashboard!</p>
                <p className="text-sm text-gray-500 mt-2">Use the sidebar to navigate to Upload Images or Upload Videos.</p>
            </div>
        </div>
    );
}

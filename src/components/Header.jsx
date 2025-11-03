
import React, { useState } from 'react';
import logo from '../assets/logo.jpg';
import { Bell, Cog, UserCircle } from 'lucide-react';

import ModalLogin from './ModalLogin';

export default function Header({ user }) {
    const [showLoginModal, setShowLoginModal] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-16 items-center justify-between px-8">
                {/* Logo Left */}
                <a href="/" className="flex items-center">
                    <img
                        src={logo}
                        alt="Figure It - Handcrafted doll ensembles"
                        className="h-10 w-auto max-h-10 object-contain"
                        style={{ maxWidth: '150px' }}
                    />
                </a>

                {/* Center Title */}
                <div className="flex-1 flex justify-center">
                    <span className="text-2xl font-bold text-foreground tracking-tight">FigureIt Admin</span>
                </div>

                {/* Right Side: User Info & Icons */}
                <div className="flex items-center gap-6">
                    <span className="text-base text-muted-foreground font-medium hidden md:inline">Welcome, {user?.fullName || 'User'}!</span>
                    <Bell className="h-6 w-6 text-muted-foreground cursor-pointer hover:text-primary" />
                    <Cog className="h-6 w-6 text-muted-foreground cursor-pointer hover:text-primary" />
                    <button
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-primary/10 focus:outline-none"
                        onClick={() => setShowLoginModal(true)}
                        aria-label="User Login"
                    >
                        <UserCircle className="h-7 w-7 text-primary" />
                    </button>
                </div>

                {/* Modal Login Box */}
                {showLoginModal && (
                    <ModalLogin onClose={() => setShowLoginModal(false)} />
                )}
            </div>
        </header>
    );
}
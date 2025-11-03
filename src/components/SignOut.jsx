import React from 'react';
import { supabase } from '../supabaseClient';

export default function SignOut() {
    const handleSignOut = async () => {
        if (!supabase) {
            alert('Supabase is not configured.');
            return;
        }

        const { error } = await supabase.auth.signOut();
        if (error) {
            alert('Error signing out: ' + error.message);
        } else {
            window.location.href = '/login';
        }
    };

    return (
        <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
        >
            Sign Out
        </button>
    );
}

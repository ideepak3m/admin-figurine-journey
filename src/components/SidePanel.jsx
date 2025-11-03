import React from 'react';
import { UserCircle, Bell, Cog } from 'lucide-react';

export default function SidePanel({ user, logoWidth = 150 }) {
    return (
        <aside
            className="bg-card border-r border-border flex flex-col py-6 shadow-lg"
            style={{ width: logoWidth, minWidth: logoWidth, maxWidth: logoWidth }}
        >
            <nav className="flex flex-col gap-4 px-4">
                <a href="#" className="flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-primary/10">
                    {/* You can use an icon or just text for now */}
                    Upload Images
                </a>
                <a href="#upload-videos" className="flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-primary/10">
                    Upload Videos
                </a>
            </nav>
        </aside>
    );
}

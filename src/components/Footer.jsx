import React from 'react';

export default function Footer() {
    return (
        <footer className="border-t border-border bg-card">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-primary">Figure It</h3>
                        <p className="text-sm text-muted-foreground">
                            Handcrafted figurines that tell your story. From photo to charm,
                            we bring your memories to life.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-foreground">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a
                                    href="#upload-images"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Upload Images
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#upload-videos"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Upload Videos
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                    <p>© {new Date().getFullYear()} Figure It. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
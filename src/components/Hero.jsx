import React from 'react';

export default function Hero() {
    return (
        <section className="relative bg-background py-20">
            <div className="container mx-auto px-4 text-center">
                <h1 className="text-5xl font-bold text-foreground mb-6">
                    Admin Activities
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                    Manage and upload your figurine collection images and videos. Keep track of your handcrafted creations and share your journey with customers.
                </p>
            </div>
        </section>
    );
}

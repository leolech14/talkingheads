
import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
                AI Talking Head Video Generator
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
                Turn any portrait image into a lifelike talking video. Simply upload a photo, provide a script, and let our AI bring it to life with natural expressions and perfectly synced audio.
            </p>
        </header>
    );
};

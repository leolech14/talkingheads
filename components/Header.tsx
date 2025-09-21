import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="relative text-center py-4">
            <div className="absolute top-1/2 left-0 -translate-y-1/2">
                <span className="text-xl font-bold text-neutral-100 tracking-tighter">Talkingheads</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-neutral-100">
                AI Talking Head Video Generator
            </h1>
        </header>
    );
};

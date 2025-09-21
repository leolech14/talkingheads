import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="flex justify-between items-center py-4">
            <div>
                <span className="text-5xl font-bold text-neutral-100 tracking-tighter">Talkingheads</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 text-right">
                AI PROFESSIONAL TEXT-TO-SPEECH VIDEO GENERATOR
            </h1>
        </header>
    );
};
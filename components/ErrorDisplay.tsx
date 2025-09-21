import React from 'react';

interface ErrorDisplayProps {
    message: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
    return (
        <div className="w-full text-center bg-red-950/50 border border-red-800 text-red-400 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold block">An Error Occurred</strong>
            <span className="block sm:inline mt-2 text-sm">{message}</span>
        </div>
    );
};
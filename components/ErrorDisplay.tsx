
import React from 'react';

interface ErrorDisplayProps {
    message: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
    return (
        <div className="w-full text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold block">An Error Occurred</strong>
            <span className="block sm:inline mt-2">{message}</span>
        </div>
    );
};

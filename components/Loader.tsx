import React from 'react';
import { PipelineStage } from '../types';

interface LoaderProps {
    currentStage: PipelineStage;
}

const STAGES: { id: PipelineStage; text: string }[] = [
    { id: 'GENERATING_IMAGE', text: 'Generating expressive image...' },
    { id: 'STARTING_VIDEO', text: 'Initializing video generation...' },
    { id: 'RENDERING_VIDEO', text: 'Rendering video... (This can take a few minutes)' },
    { id: 'DOWNLOADING_VIDEO', text: 'Downloading final video...' },
    { id: 'CREATING_THUMBNAIL', text: 'Finalizing and creating thumbnail...' },
];

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SpinnerIcon = () => (
    <svg className="animate-spin h-6 w-6 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const PendingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


export const Loader: React.FC<LoaderProps> = ({ currentStage }) => {
    const currentStageIndex = STAGES.findIndex(s => s.id === currentStage);

    return (
        <div className="w-full max-w-md p-4">
            <div className="text-center mb-6">
                 <p className="text-xl font-semibold text-gray-200">Generating Your Video</p>
                 <p className="text-gray-400 mt-1">Please keep this window open.</p>
            </div>
            <div className="space-y-4">
                {STAGES.map((stage, index) => {
                    const isCompleted = currentStageIndex > index;
                    const isActive = currentStageIndex === index;

                    return (
                         <div key={stage.id} className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-lg">
                            <div className="flex-shrink-0">
                                {isCompleted ? <CheckIcon /> : isActive ? <SpinnerIcon /> : <PendingIcon />}
                            </div>
                            <p className={`font-medium ${isActive ? 'text-cyan-300' : isCompleted ? 'text-green-400' : 'text-gray-500'}`}>
                                {stage.text}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

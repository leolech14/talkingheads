import React, { createContext, useContext } from 'react';
import { PipelineStage, GallerySelection } from '../types';

interface PipelineContextType {
    pipelineStage: PipelineStage;
    isBusy: boolean;
    selection: GallerySelection;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export const PipelineProvider = PipelineContext.Provider;

export const usePipeline = (): PipelineContextType => {
    const context = useContext(PipelineContext);
    if (!context) {
        throw new Error('usePipeline must be used within a PipelineProvider');
    }
    return context;
};

import React from 'react';
import { FilmIcon } from '@heroicons/react/24/outline';
import { ComingSoon } from './common/ComingSoon';

export const VideoEditor: React.FC = () => {
    return (
        <ComingSoon
            title="Video Editor"
            icon={<FilmIcon className="w-16 h-16 text-zinc-500 animate-spin [animation-duration:5s]" />}
            message="Configuration options will be available here in a future update."
        />
    );
};

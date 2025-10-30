import React from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
import { ComingSoon } from './common/ComingSoon';

export const VideoGenerator: React.FC = () => {
    return (
        <ComingSoon
            title="Video Generator"
            icon={<VideoCameraIcon className="w-16 h-16 text-zinc-500 animate-spin [animation-duration:5s]" />}
            message="Configuration options will be available here in a future update."
        />
    );
};

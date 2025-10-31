import React from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
import { ComingSoon } from './common/ComingSoon';
import { useLanguage } from '../contexts/LanguageContext';

export const VideoGenerator: React.FC = () => {
    const { t } = useLanguage();
    return (
        <ComingSoon
            title={t('video_generator_title')}
            icon={<VideoCameraIcon className="w-16 h-16 text-zinc-500 animate-spin [animation-duration:5s]" />}
            message={t('coming_soon_message')}
        />
    );
};

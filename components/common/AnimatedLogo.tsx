import React from 'react';

const AnimatedLogo: React.FC = () => {
    return (
        <>
            <style>{`
                @keyframes draw {
                    to {
                        stroke-dashoffset: 0;
                    }
                }
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                #logo-s {
                    stroke-dasharray: 230;
                    stroke-dashoffset: 230;
                    animation: draw 1.2s cubic-bezier(0.65, 0, 0.35, 1) forwards;
                }
                #logo-text {
                    opacity: 0;
                    animation: fade-in 0.8s ease-out 0.8s forwards;
                }
            `}</style>
            <div className="flex items-center" aria-label="SAHAN edit logo">
                <svg width="150" height="40" viewBox="0 0 150 40">
                    <g transform="translate(0, 5)">
                        <path
                            id="logo-s"
                            d="M30 25 C 10 25, 10 5, 30 5"
                            stroke="url(#logo-gradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            fill="none"
                        />
                    </g>
                    <text
                        id="logo-text"
                        x="42"
                        y="27"
                        fontFamily="sans-serif"
                        fontSize="18"
                        fontWeight="bold"
                        fill="white"
                    >
                        AHAN edit
                    </text>
                    <defs>
                        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#a855f7' }} /> 
                            <stop offset="100%" style={{ stopColor: '#4f46e5' }} />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        </>
    );
};

export { AnimatedLogo };

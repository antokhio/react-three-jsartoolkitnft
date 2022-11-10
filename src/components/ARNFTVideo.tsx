import React from 'react';

type ARNFTVideoComponent = {
    style?: React.CSSProperties;
};

export const ARNFTVideo = React.forwardRef<HTMLVideoElement, ARNFTVideoComponent>(({ ...props }, ref) => {
    return (
        <video
            id='ar-video'
            style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                left: 0,
                top: 0,
                objectFit: 'cover',
                ...props.style,
            }}
            ref={ref}
            loop
            autoPlay
            muted
            playsInline
            {...props}
        />
    );
});

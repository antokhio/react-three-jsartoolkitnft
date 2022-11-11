import React, { CSSProperties, useRef } from 'react';
import { Canvas, Props as CanvasProps } from '@react-three/fiber';
import { ARNFTVideo } from './ARNFTVideo';
import { ARNFTProvider } from './ARNFTProvider';
import { mergeRefs } from '../utilites';

type ARNFTCanvasProps = {
    camera_para?: string;
} & CanvasProps;

const style: CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
};

export const ARNFTCanvas = React.forwardRef<HTMLCanvasElement, ARNFTCanvasProps>(
    ({ camera_para = '/data/camera_para.dat', children }, ref) => {
        const video = useRef<HTMLVideoElement>(null!);
        const canvas = useRef<HTMLCanvasElement>(null!);
        return (
            <>
                <ARNFTVideo ref={video} style={style} />
                <Canvas style={style} ref={mergeRefs([canvas, ref])}>
                    <ARNFTProvider video={video} canvas={canvas} camera_para={camera_para}>
                        {children}
                    </ARNFTProvider>
                </Canvas>
            </>
        );
    }
);

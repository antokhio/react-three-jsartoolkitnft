import { useFrame, useThree } from '@react-three/fiber';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Group, Matrix4 } from 'three';
import { ARNFT } from '../arnft';

type ARNFTProviderComponent = React.FC<{
    children: React.ReactNode;
    camera_para?: string;
    canvas: React.MutableRefObject<HTMLCanvasElement>;
    video: React.MutableRefObject<HTMLVideoElement>;
}>;

type Marker = {
    urls: string[];
    root: Group;
    persisted: boolean;
};

export type ARNFTContext = {
    markers: React.MutableRefObject<Marker[]>;
    loaded: boolean;
    initialized: boolean;
};

export const arnftContext = React.createContext<ARNFTContext | null>(null);

const constraints: MediaStreamConstraints = {
    audio: false,
    video: {
        facingMode: 'environment',
        width: 640,
        height: 480,
    },
};

export const ARNFTProvider: ARNFTProviderComponent = ({
    children,
    camera_para = '/data/camera_para.dat',
    canvas,
    video,
}) => {
    const gl = useThree((state) => state.gl);
    const camera = useThree((state) => state.camera);

    const markers = useRef<Marker[]>([]);
    const arnft = useRef<ARNFT>(new ARNFT());

    const [initialized, setInitialized] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const onLoaded = useCallback(() => {
        setLoaded(true);
    }, []);

    const onInitialized = useCallback(() => {
        setInitialized(true);
        arnft.current.load(markers.current, onLoaded);
    }, [markers]);

    const init = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.current.srcObject = stream;
        video.current.onloadedmetadata = async (e: any) => {
            console.info('VIDEO:', e.target.videoWidth, e.target.videoHeight);
            video.current.play();

            arnft.current.initialize(
                {
                    video: video.current,
                    camera: camera,
                    camera_para,
                    vw: e.target.videoWidth,
                    vh: e.target.videoHeight,
                },
                onInitialized
            );
        };
    }, []);

    useEffect(() => {
        init();
    }, []);

    useFrame(() => {
        if (loaded) arnft.current.process();
    });

    return (
        <arnftContext.Provider value={{ markers: markers, loaded, initialized }}>
            {children}
        </arnftContext.Provider>
    );
};

export const useARNFT = () => {
    const value = useContext(arnftContext) as ARNFTContext;
    return useMemo(() => value, [value]);
};

export const useARNFTMarker = (urls: string[], persisted: boolean = false) => {
    const ref = useRef<Group>(null!);
    const { markers } = useContext(arnftContext) as ARNFTContext;

    useEffect(() => {
        markers.current = [...markers.current, { urls, root: ref.current, persisted }];
        // TODO add cleanup
        //return () => markers.current = markers.current.filter()
    }, [urls]);

    return ref;
};

import React from 'react';
import * as THREE from 'three';
import { useARNFTMarker } from './ARNFTProvider';
import { mergeRefs } from 'react-merge-refs';

type ARNFTMarkerProps = JSX.IntrinsicElements['group'] & {
    markers: string[];
    persisted?: boolean;
};

export const ARNFTMarker = React.forwardRef<THREE.Group, ARNFTMarkerProps>(
    ({ children, markers, persisted = false, ...props }, ref) => {
        const marker = useARNFTMarker(markers, persisted);
        return (
            <group ref={mergeRefs([marker, ref])} matrixAutoUpdate={false} {...props}>
                <group name='center'>{children}</group>
            </group>
        );
    }
);

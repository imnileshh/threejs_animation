'use client';
import { useGLTF } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { useEffect, useRef } from 'react';
gsap.registerPlugin(ScrollTrigger);

export function LogoModel() {
    const topModel = useGLTF('/models/T3d.glb');

    const groupRef = useRef(null);
    const topRef = useRef(null);
    const bottomRef = useRef(null);
    const thirdRef = useRef(null);
    const fourthRef = useRef(null);
    const fifthRef = useRef(null);
    const sixthRef = useRef(null);
    const seventhRef = useRef(null);

    // ✅ Positions & rotations taken directly from your logomodel.txt
    const spiralConfigs = [
        { s: 6, p: [-1.1, 1.1, 0], r: [Math.PI / 2.12, 0.0, 0.0] },
        { s: 6, p: [-1.4, 0.7, 0], r: [Math.PI / 2.1, 0.4, 0.0] },
        { s: 5.8, p: [-1.5, 0.25, 0], r: [Math.PI / 2.2, 0.8, 0.0] },
        { s: 5.6, p: [-1.4, -0.2, 0], r: [Math.PI / 2.4, 1.2, 0.0] },
        { s: 5.3, p: [-1.1, -0.54, 0], r: [Math.PI / 2.6, 1.65, 0.0] },
        { s: 4.5, p: [-0.75, -0.7, 0], r: [Math.PI / 3, 2.1, 0.0] },
        { s: 3.8, p: [-0.46, -0.8, -0.11], r: [Math.PI / 3, 2.5, 0.0] },
    ];

    useEffect(() => {
        if (
            !groupRef.current ||
            !topRef.current ||
            !bottomRef.current ||
            !thirdRef.current ||
            !fourthRef.current ||
            !fifthRef.current ||
            !sixthRef.current ||
            !seventhRef.current
        )
            return;
        ScrollTrigger.getAll().forEach(t => t.kill());

        const sliceRefs = [topRef, bottomRef, thirdRef, fourthRef, fifthRef, sixthRef, seventhRef];


    }, []);

    return (
        
        <group ref={groupRef} scale={[1.15, 1.15, .15]} position={[-2, -0.5, 0]} rotation={[-0.2, 0.6, 0]}>
            <primitive
                ref={topRef}
                object={topModel.scene.clone()}
                scale={spiralConfigs[0].s}
                position={spiralConfigs[0].p}
                rotation={spiralConfigs[0].r}
            />
            <primitive
                ref={bottomRef}
                object={topModel.scene.clone()}
                scale={spiralConfigs[1].s}
                position={spiralConfigs[1].p}
                rotation={spiralConfigs[1].r}
            />
            <primitive
                ref={thirdRef}
                object={topModel.scene.clone()}
                scale={spiralConfigs[2].s}
                position={spiralConfigs[2].p}
                rotation={spiralConfigs[2].r}
            />
            <primitive
                ref={fourthRef}
                object={topModel.scene.clone()}
                scale={spiralConfigs[3].s}
                position={spiralConfigs[3].p}
                rotation={spiralConfigs[3].r}
            />
            <primitive
                ref={fifthRef}
                object={topModel.scene.clone()}
                scale={spiralConfigs[4].s}
                position={spiralConfigs[4].p}
                rotation={spiralConfigs[4].r}
            />
            <primitive
                ref={sixthRef}
                object={topModel.scene.clone()}
                scale={spiralConfigs[5].s}
                position={spiralConfigs[5].p}
                rotation={spiralConfigs[5].r}
            />
            <primitive
                ref={seventhRef}
                object={topModel.scene.clone()}
                scale={spiralConfigs[6].s}
                position={spiralConfigs[6].p}
                rotation={spiralConfigs[6].r}
            />
        </group>
    );
}

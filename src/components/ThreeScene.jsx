'use client';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';

export default function ThreeScene({ count = 200, speed = 0.02 }) {
    const mesh = useRef();

    // Generate stars in vertical alignment
    const stars = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * 5; // small spread horizontally
            const y = Math.random() * 20; // vertical stacking
            const z = (Math.random() - 0.5) * 5;
            temp.push([x, y, z]);
        }
        return temp;
    }, [count]);

    // Animate: move stars upward, respawn when out of view
    useFrame(() => {
        mesh.current.children.forEach(star => {
            star.position.y += speed;
            if (star.position.y > 10) {
                star.position.y = -10; // reset to bottom
            }
        });
    });

    return (
        <group ref={mesh}>
            {stars.map(([x, y, z], i) => (
                <mesh key={i} position={[x, y, z]}>
                    <sphereGeometry args={[0.03, 8, 8]} />
                    <meshBasicMaterial color="white" />
                </mesh>
            ))}
        </group>
    );
}

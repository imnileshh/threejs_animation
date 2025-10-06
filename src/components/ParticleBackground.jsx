'use client';

import { Canvas } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
  void main() {
    vec3 pos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 10.0;
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform sampler2D uTexture;

  void main() {
    vec4 tex = texture2D(uTexture, gl_PointCoord);
    gl_FragColor = vec4(uColor, 1.0) * tex;
  }
`;

function Particles() {
    function createCircleTexture() {
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, size, size);
        const cx = size / 2;
        const cy = size / 2;
        const coreR = Math.floor(size * 0.2);

        ctx.imageSmoothingEnabled = false;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        return tex;
    }

    // const texture = useTexture('/images/sp2.png');
    const shaderRef = useRef();
    const texture = createCircleTexture();
    // Create a static radial grid of points
    const positions = useMemo(() => {
        const cols = 40;
        const rows = 30;
        const spacing = 0.5;
        const curveStrength = 0.15;
        const pos = new Float32Array(cols * rows * 3);

        let i = 0;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const xPos = (x - cols / 2) * spacing;
                const yPos = (y - rows / 2) * spacing;

                const zCurve = yPos * yPos * 1.3 * curveStrength;

                pos[i * 3 + 0] = xPos;
                pos[i * 3 + 1] = yPos;
                pos[i * 3 + 2] = zCurve;
                i++;
            }
        }

        return pos;
    }, []);

    const shaderMaterial = useMemo(
        () =>
            new THREE.ShaderMaterial({
                uniforms: {
                    uColor: { value: new THREE.Color('#000000') },
                    uTexture: { value: texture },
                },
                vertexShader,
                fragmentShader,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            }),
        [texture]
    );

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <primitive object={shaderMaterial} ref={shaderRef} attach="material" />
        </points>
    );
}

export default function ParticleBackground() {
    return (
        <div className="fixed top-0 left-0 w-full h-full z-10">
            <Canvas camera={{ position: [0, 0, 50], fov: 75 }}>
                <ambientLight intensity={1} />
                <directionalLight position={[10, 10, 5]} />
                {/* <Suspense
                    fallback={
                        <Html>
                            <div style={{ color: 'white' }}>Loading...</div>
                        </Html>
                    }
                >
                    <LogoModel />
                </Suspense> */}
                <Particles />
            </Canvas>
        </div>
    );
}

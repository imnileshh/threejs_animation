'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Particle = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const loader = new THREE.TextureLoader();
        const star = loader.load(
            '/images/746a82ae37c272afcb7ddf02dfd10c71061c546a-removebg-preview.png'
        );

        function createSpiral(numParticles, turns, spacing, radius, color, posX = 0, posY = 0) {
            const positions = [];
            const thetaStep = (Math.PI * 2 * turns) / numParticles;

            for (let i = 0; i < numParticles; i++) {
                const theta = i * thetaStep;
                const r = radius + i * 0.002; // slowly expand radius
                const x = r * Math.cos(theta) + posX;
                const y = r * Math.sin(theta) + posY;
                const z = spacing * i;

                positions.push(x, y, z);
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

            const material = new THREE.PointsMaterial({
                size: 1,
                color: color,
                map: star,
                transparent: true,
                opacity: 1,
            });

            return new THREE.Points(geometry, material);
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 30;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        const geometry = new THREE.TorusGeometry(10, 3, 16, 100);

        const material = new THREE.PointsMaterial({
            sizeAttenuation: true,
            color: 0xffffff, // red (can also use a CSS color string here)
            size: 0.09,
        });
        const starMaterial = new THREE.PointsMaterial({
            sizeAttenuation: true,
            color: 'silver',
            size: 0.3,
            map: star,
            transparent: true,
        });

        const particleGeometry = new THREE.BufferGeometry();
        const particlesCount = 5000;

        const posArray = new Float32Array(particlesCount * 3);
        const originalPositions = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            const value = Math.random() * 50 - Math.random() * 50;
            posArray[i] = value;
            originalPositions[i] = value;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const torus = new THREE.Points(geometry, material);

        const particleDesign = new THREE.Points(particleGeometry, starMaterial);

        // scene.add(torus, particleDesign);

        // const controls = new OrbitControls(camera, renderer.domElement);

        const mouse = new THREE.Vector2();
        let mouseActive = false;
        let mouseTimeout;

        window.addEventListener('mousemove', event => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            mouseActive = true;
            clearTimeout(mouseTimeout);
            mouseTimeout = setTimeout(() => {
                mouseActive = false;
            }, 100); // after 100ms of no movement, deactivate
        });
        const velocities = new Float32Array(particlesCount * 3);
        const spirals = [];

        spirals.push(createSpiral(2000, 8, 0.05, 5, 0x66ccff, 20, 3));
        spirals.push(createSpiral(1500, 10, 0.07, 7, 0xff66cc, -20, -4));
        spirals.push(createSpiral(1800, 12, 0.06, 6, 0xffff99, 10, -30));
        spirals.push(createSpiral(1800, 12, 0.06, 6, 0xffff99, 25, -20));
        spirals.push(createSpiral(1800, 12, 0.06, 6, 0xffff99, 15, 30));
        spirals.push(createSpiral(1800, 12, 0.06, 6, 0xffff99, -10, 15));
        spirals.push(createSpiral(1800, 12, 0.06, 6, 0xffff99, -25, -3));

        spirals.forEach(s => scene.add(s));

        function animate() {
            torus.rotation.y += 0.02;
            torus.rotation.x += 0.02;

            spirals.forEach((s, i) => {
                // s.rotation.y += 0.001 + i * 0.0005; // slightly different speeds
                // s.rotation.x += 0.0005 + i * 0.0002;
                // s.rotation.z += 0.0005 + i * 0.0002;
            });

            // const positions = particleDesign.geometry.attributes.position.array;

            // const influenceRadius = 4; // much smaller radius
            // const maxDisplacement = 15; // stars won’t fly away too far

            // for (let i = 0; i < particlesCount; i++) {
            //     const ix = i * 3;
            //     const iy = i * 3 + 1;
            //     const iz = i * 3 + 2;

            //     const ox = originalPositions[ix];
            //     const oy = originalPositions[iy];
            //     const oz = originalPositions[iz];

            //     let targetX = ox;
            //     let targetY = oy;
            //     let targetZ = oz;

            //     if (mouseActive) {
            //         const dx = ox - mouse.x * 100;
            //         const dy = oy - mouse.y * 100;
            //         const dist = Math.sqrt(dx * dx + dy * dy);

            //         if (dist < influenceRadius) {
            //             // exponential falloff (closer = stronger)
            //             const strength = Math.exp(-dist * 0.15);

            //             targetX = ox + (dx / dist) * strength * maxDisplacement;
            //             targetY = oy + (dy / dist) * strength * maxDisplacement;
            //         }
            //     }

            //     // Spring motion
            //     const stiffness = 0.1;
            //     const damping = 0.85;

            //     const fx = (targetX - positions[ix]) * stiffness;
            //     const fy = (targetY - positions[iy]) * stiffness;
            //     const fz = (targetZ - positions[iz]) * stiffness;

            //     velocities[ix] = velocities[ix] * damping + fx;
            //     velocities[iy] = velocities[iy] * damping + fy;
            //     velocities[iz] = velocities[iz] * damping + fz;

            //     positions[ix] += velocities[ix];
            //     positions[iy] += velocities[iy];
            //     positions[iz] += velocities[iz];
            // }

            // particleDesign.geometry.attributes.position.needsUpdate = true;

            // controls.update();
            renderer.render(scene, camera);
        }
        renderer.setAnimationLoop(animate);

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            renderer.dispose();
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    return (
        <div className="relative">
            <canvas
                ref={canvasRef}
                className="fixed top-0 left-0 w-full h-full bg-transparent z-50 "
            />
            {/* Intro (centered) */}
            <div className="h-screen flex items-center justify-center px-8 bg-gradient-to-b from-slate-900 to-slate-800 text-white z-100">
                <div className="max-w-3xl text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        The Collection
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 mb-6">
                        Explore a curated selection of craft and culture. Scroll to discover — each
                        chapter reveals a new piece.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Particle;

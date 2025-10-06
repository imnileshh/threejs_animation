'use client';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import TubeEffect from '../../components/oldcode/TubeEffect';

const Animation = () => {
    const canvasRef = useRef(null);
    const [showStarfield, setShowStarfield] = useState(false);

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

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.5,
            easing: t => 1 - Math.pow(1 - t, 3),
            smoothWheel: true,
            smoothTouch: false,
        });

        lenis.on('scroll', ScrollTrigger.update);

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(0, 0, 10);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Handle window resizing
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light from a direction
        directionalLight.position.set(5, 10, 5); // Position the light
        scene.add(directionalLight);

        new RGBELoader().load('/images/studio_small_03_1k.hdr', hdrMap => {
            hdrMap.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = hdrMap;
            // scene.background = hdrMap;
        });

        const loader = new GLTFLoader();
        let particlesGeometry = null;
        let particlesMaterial = null;
        let particleSystem = null;
        let solidMesh = null;

        loader.load(
            '/models/T3d.glb',
            gltf => {
                const model = gltf.scene;
                solidMesh = model.children[0];
                solidMesh.material.transparent = true;
                solidMesh.scale.set(55, 55, 55);
                solidMesh.position.set(0, 0, 0);
                solidMesh.rotation.set(0, Math.PI / 3, 0);
                solidMesh.material.depthWrite = false;
                scene.add(solidMesh);

                if (solidMesh && solidMesh.isMesh) {
                    createParticleSystem(solidMesh);
                }
            },
            undefined,
            error => {
                console.error(error);
            }
        );

        function createParticleSystem(mesh) {
            const sampler = new MeshSurfaceSampler(mesh).build();
            const numParticles = 1000;

            particlesGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array(numParticles * 3);
            const randoms = new Float32Array(numParticles * 3); // For the "exploded" state

            const sizes = new Float32Array(numParticles);
            const colors = new Float32Array(numParticles * 3);

            for (let i = 0; i < numParticles; i++) {
                const newPosition = new THREE.Vector3();
                sampler.sample(newPosition);

                positions[i * 3] = newPosition.x;
                positions[i * 3 + 1] = newPosition.y;
                positions[i * 3 + 2] = newPosition.z;

                randoms[i * 3] = (Math.random() - 0.5) * 5;
                randoms[i * 3 + 1] = (Math.random() - 0.5) * 5;
                randoms[i * 3 + 2] = (Math.random() - 0.5) * 5;

                sizes[i] = 8 + Math.random() * 128;

                // 👇 Random color per particle
                const color = new THREE.Color();
                color.setHSL(Math.random(), 0.7, 0.6);
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
            }

            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particlesGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));
            particlesGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
            particlesGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

            particlesMaterial = createShaderMaterial();

            particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
            particleSystem.position.copy(solidMesh.position);
            particleSystem.rotation.copy(solidMesh.rotation);
            particleSystem.scale.copy(solidMesh.scale);

            scene.add(particleSystem);

            setupScrollAnimation();
        }

        let particleTexture = createCircleTexture();

        function createShaderMaterial() {
            const vertexShader = `
       attribute vec3 aRandom;
attribute float aSize;
attribute vec3 aColor;

uniform float uProgress;
uniform float uTime;
uniform float uSizeMultiplier;

varying float vProgress;
varying vec3 vColor;

void main() {
    vProgress = uProgress;
    vColor = aColor;

    vec3 finalPosition = mix(position, aRandom, uProgress);

    // Orbit effect
    float orbitRadius = 0.3 + fract(aRandom.y) * 0.2;
    float speed = 0.2 + fract(aRandom.z) * 0.5;
    finalPosition.x += cos(uTime * speed + aRandom.x) * orbitRadius * uProgress;
    finalPosition.y += sin(uTime * speed + aRandom.y) * orbitRadius * uProgress;

    vec4 modelViewPosition = modelViewMatrix * vec4(finalPosition, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;

    gl_PointSize = aSize * uSizeMultiplier;
}

    `;

            const fragmentShader = `
       uniform sampler2D uTexture;
uniform float uVisibility;

varying float vProgress;
varying vec3 vColor;

void main() {
    vec2 centeredCoord = gl_PointCoord - vec2(0.5);
    if (length(centeredCoord) > 0.5) discard;

    vec4 texColor = texture2D(uTexture, gl_PointCoord);
    vec4 finalColor = vec4(vColor, 1.0) * texColor;

    finalColor.a *= uVisibility; // fade out with scroll
    gl_FragColor = finalColor;
}

    `;

            return new THREE.ShaderMaterial({
                uniforms: {
                    // Make sure all your uniforms are still here
                    uProgress: { value: 0.0 },
                    uColorProgress: { value: 0.0 },
                    uTexture: { value: particleTexture },
                    uVisibility: { value: 0.0 },
                    uTime: { value: 0.0 },
                    uSizeMultiplier: { value: 1.0 }, // ✅ Add this new uniform

                    uMouse: { value: new THREE.Vector2(0.0, 0.0) },
                },
                vertexShader,
                fragmentShader,
                transparent: true,
                // blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
        }

        function setupScrollAnimation() {
            gsap.registerPlugin(ScrollTrigger);

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: '.scroll-container',
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: true,
                },
            });

            tl.to(particlesMaterial.uniforms.uVisibility, {
                value: 1.0,
                duration: 1,
            });
            tl.to(
                solidMesh.material,
                {
                    opacity: 0.0,
                    duration: 0.1,
                },
                '<'
            );
            tl.to(
                particlesMaterial.uniforms.uProgress,
                {
                    value: 1.0,
                    duration: 20,
                    ease: 'power1.inOut',
                },
                '<'
            );
            tl.to(
                camera,
                {
                    fov: 5, // Narrow the field of view
                    duration: 20,
                    ease: 'power1.inOut',
                    onUpdate: () => {
                        camera.updateProjectionMatrix();
                    },
                },
                '<'
            );

            // tl.to(
            //     camera.position,
            //     {
            //         z: 25, // The camera flies through the particle cloud
            //         duration: 10,
            //         ease: 'power1.inOut',
            //     },
            //     '<'
            // );

            tl.to(
                particlesMaterial.uniforms.uSizeMultiplier,
                {
                    value: 0.0,
                    duration: 3,
                    ease: 'power2.inOut',
                },
                '>-3' // Start 3 seconds before the timeline ends
            );

            // 4. Reveal the final content
            tl.to(
                '.revealed-content',
                {
                    opacity: 1,
                    duration: 3,
                    ease: 'power2.inOut',
                    onStart: () => {
                        setShowStarfield(true);
                    },
                    onReverseComplete: () => {
                        setShowStarfield(false);
                    },
                },
                '<-5'
            );
        }

        let mouseX = 0;
        let mouseY = 0;

        const handleMouseMove = event => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);

        function animate() {
            if (particlesMaterial) {
                particlesMaterial.uniforms.uTime.value = performance.now() * 0.001;
            }
            camera.position.x += (mouseX * 5 - camera.position.x) * 0.02;
            camera.position.y += (mouseY * 5 - camera.position.y) * 0.02;

            renderer.render(scene, camera);
        }
        renderer.setAnimationLoop(animate);
    }, []);
    return (
        <main className="relative bg-[radial-gradient(circle_at_center,_#1a1a2e,_#0f0f1f,_#000000)]">
            {/* ✅ Add z-10 to ensure the canvas is on top */}
            <canvas ref={canvasRef} className="fixed top-0 left-0 outline-none z-0" />

            <div className="scroll-container h-[800vh]"></div>

            {/* ✅ MODIFIED: This div is now fixed behind the canvas */}
            <div className="h-[200vh] revealed-content fixed inset-0 flex items-center justify-center text-center z-0 opacity-0 isolate">
                {showStarfield && <TubeEffect />}
            </div>
        </main>
    );
};

export default Animation;

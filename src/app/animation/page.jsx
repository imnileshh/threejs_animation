'use client';
import { Canvas } from '@react-three/fiber';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import Navbar from '../../components/Navbar.jsx';
import FlowingParticles from '../../components/ParticleBackground.jsx';
import StarfieldBackground from '../../components/StarfieldBackground';

// ✅ It's good practice to register the plugin once
gsap.registerPlugin(ScrollTrigger);

const Animation = () => {
    const canvasRef = useRef(null);
    const [showStarfield, setShowStarfield] = useState(false);
    const flowAnimation = useRef({ scrollSpeed: 0 });
    const flowingParticlesMaterialRef = useRef();

    // This function remains unchanged
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
        camera.position.set(0, 0, 5);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        scene.add(directionalLight);

        new RGBELoader().load('/images/studio_small_03_1k.hdr', hdrMap => {
            hdrMap.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = hdrMap;
        });

        const spiralConfigs = [
            { s: 6, p: [-1.1, 1.1, 0], r: [Math.PI / 2.12, 0.0, 0.0] },
            { s: 6, p: [-1.4, 0.7, 0], r: [Math.PI / 2.1, 0.4, 0.0] },
            { s: 5.8, p: [-1.5, 0.25, 0], r: [Math.PI / 2.2, 0.8, 0.0] },
            { s: 5.6, p: [-1.4, -0.2, 0], r: [Math.PI / 2.4, 1.2, 0.0] },
            { s: 5.3, p: [-1.1, -0.54, 0], r: [Math.PI / 2.6, 1.65, 0.0] },
            { s: 4.5, p: [-0.75, -0.7, 0], r: [Math.PI / 3, 2.1, 0.0] },
            { s: 3.8, p: [-0.46, -0.8, -0.11], r: [Math.PI / 3, 2.5, 0.0] },
        ];

        const loader = new GLTFLoader();
        let particlesMaterial = null;
        let logoGroup = null;

        loader.load(
            '/models/T3d.glb',
            gltf => {
                const sourceScene = gltf.scene;
                logoGroup = new THREE.Group();
                logoGroup.scale.set(1.15, 1.15, 0.15);

                // ✅ Set initial position to the left, as per the first image.
                logoGroup.position.set(-3, -0.5, 0);
                logoGroup.rotation.set(0.1, 0.6, -0.2);

                const allMaterials = [];

                spiralConfigs.forEach(config => {
                    const modelClone = sourceScene.clone();
                    modelClone.scale.setScalar(config.s);
                    modelClone.position.fromArray(config.p);
                    modelClone.rotation.fromArray(config.r);

                    modelClone.traverse(child => {
                        if (child.isMesh && child.material) {
                            const newMaterial = child.material.clone();
                            newMaterial.transparent = true;
                            newMaterial.depthWrite = false;
                            child.material = newMaterial;
                            allMaterials.push(newMaterial);
                        }
                    });
                    logoGroup.add(modelClone);
                });

                scene.add(logoGroup);

                // Create an invisible, rotated clone of the model JUST for sampling particles
                const samplingGroup = logoGroup.clone(true);
                // This clone should be at the *final* centered position for correct sampling
                samplingGroup.position.set(-0.5, -2, 2);
                samplingGroup.rotation.z += -Math.PI / 2; // Apply the final rotation
                samplingGroup.rotation.y += -Math.PI / 4; // Apply the final rotation

                // Create the particle system from the rotated clone
                createParticleSystem(samplingGroup, allMaterials);
            },
            undefined,
            error => {
                console.error(error);
            }
        );

        // createParticleSystem function remains largely unchanged
        function createParticleSystem(group, materials) {
            const geometries = [];
            group.updateWorldMatrix(true, true);
            group.traverse(child => {
                if (child.isMesh) {
                    const geometry = child.geometry.clone();
                    geometry.applyMatrix4(child.matrixWorld);
                    geometries.push(geometry);
                }
            });

            if (geometries.length === 0) return;

            const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);
            const mergedMeshForSampling = new THREE.Mesh(mergedGeometry);

            const sampler = new MeshSurfaceSampler(mergedMeshForSampling).build();
            const numParticles = 2000;

            const particlesGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array(numParticles * 3);
            const randoms = new Float32Array(numParticles * 3);
            const sizes = new Float32Array(numParticles);
            const colors = new Float32Array(numParticles * 3);

            for (let i = 0; i < numParticles; i++) {
                const newPosition = new THREE.Vector3();
                sampler.sample(newPosition);

                positions[i * 3] = newPosition.x;
                positions[i * 3 + 1] = newPosition.y;
                positions[i * 3 + 2] = newPosition.z;

                randoms[i * 3] = (Math.random() - 0.5) * 10;
                randoms[i * 3 + 1] = (Math.random() - 0.5) * 10;
                randoms[i * 3 + 2] = (Math.random() - 0.5) * 10;

                sizes[i] = 8 + Math.random() * 128;
                // const color = new THREE.Color();
                // color.setHSL(Math.random(), 0.7, 0.6);
                // colors[i * 3] = color.r;
                // colors[i * 3 + 1] = color.g;
                // colors[i * 3 + 2] = color.b;
            }

            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particlesGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3));
            particlesGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
            // particlesGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

            particlesMaterial = createShaderMaterial();
            const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);

            scene.add(particleSystem);
            if (flowingParticlesMaterialRef.current) {
                setupScrollAnimation(materials);
            } else {
                const checkRefInterval = setInterval(() => {
                    if (flowingParticlesMaterialRef.current) {
                        setupScrollAnimation(materials);
                        clearInterval(checkRefInterval);
                    }
                }, 100);
            }
        }

        let particleTexture = createCircleTexture();

        // createShaderMaterial function remains unchanged
        function createShaderMaterial() {
            const vertexShader = `
                attribute vec3 aRandom;
                attribute float aSize;
                attribute vec3 aColor;

                uniform float uProgress;
                uniform float uTime;
                uniform vec3 uColor;

                uniform float uSizeMultiplier;

                varying float vProgress;
                varying vec3 vColor;

                void main() {
                    vProgress = uProgress;
                    vColor = uColor;
                    vec3 finalPosition = mix(position, aRandom, uProgress);

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
                    finalColor.a *= uVisibility;
                    gl_FragColor = finalColor;
                }
            `;
            return new THREE.ShaderMaterial({
                uniforms: {
                    uProgress: { value: 0.0 },
                    uTexture: { value: particleTexture },
                    uVisibility: { value: 0.0 },
                    uTime: { value: 0.0 },
                    uColor: { value: new THREE.Color('#AB76E2') }, // ✅ added single color uniform

                    uSizeMultiplier: { value: 1.0 },
                    uMouse: { value: new THREE.Vector2(0.0, 0.0) },
                },
                vertexShader,
                fragmentShader,
                transparent: true,
                depthWrite: false,
            });
        }

        // ✅ Heavily modified this function to match the required animation sequence
        function setupScrollAnimation(materials) {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: '.scroll-container',
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 1.5, // Smoothed scrub
                    onUpdate: self => {
                        gsap.to(flowAnimation.current, {
                            scrollSpeed: self.getVelocity() * 0.005, // Multiplier to control sensitivity
                            duration: 0.9,
                            overwrite: true,
                        });
                    },
                },
            });

            // --- STEP 1 to 2: Logo moves to center, rotates, and text swaps ---

            // Move logo from left to center
            tl.to(
                logoGroup.position,
                {
                    x: -0.5,
                    y: -2,
                    z: 2,
                    duration: 10,
                    ease: 'power1.inOut',
                },
                0
            );

            // Rotate logo into final semi-circle form
            tl.to(
                logoGroup.rotation,
                {
                    x: 0,
                    y: logoGroup.rotation.y - Math.PI / 4,
                    z: logoGroup.rotation.z - Math.PI / 2,
                    duration: 10,
                    ease: 'power1.inOut',
                },
                0
            );

            // Fade out the initial text
            tl.to(
                '.initial-text',
                {
                    opacity: 0,
                    duration: 5,
                    ease: 'power1.inOut',
                },
                0
            );

            // Fade in the second text
            tl.to(
                '.second-text',
                {
                    opacity: 1,
                    duration: 5,
                    ease: 'power1.inOut',
                },
                5
            );

            // --- STEP 2 to 3: Second text fades, logo breaks into particles ---

            // Fade out the second text before the break
            tl.to(
                '.second-text',
                {
                    opacity: 0,
                    duration: 5,
                    ease: 'power1.inOut',
                },
                '>'
            );

            // Make particles visible just before the original logo fades
            tl.to(
                particlesMaterial.uniforms.uVisibility,
                {
                    value: 1.0,
                    duration: 5,
                },
                '>-=1'
            ); // Start slightly before the next step

            // Fade out the original logo materials
            tl.to(
                materials,
                {
                    opacity: 0.0,
                    duration: 0.5,
                },
                '<'
            );

            // Animate particles exploding outwards
            tl.to(
                particlesMaterial.uniforms.uProgress,
                {
                    value: 1.0,
                    duration: 20,
                    ease: 'power1.inOut',
                },
                '<'
            );

            // Zoom camera in during the particle explosion
            tl.to(
                camera,
                {
                    fov: 5,
                    duration: 15,
                    ease: 'power1.inOut',
                    onUpdate: () => {
                        camera.updateProjectionMatrix();
                    },
                },
                '<'
            );

            // Shrink particles to nothing at the end of the explosion
            tl.to(
                particlesMaterial.uniforms.uSizeMultiplier,
                {
                    value: 0.0,
                    duration: 3,
                    ease: 'power2.inOut',
                },
                '>-3'
            );
            if (
                flowingParticlesMaterialRef.current &&
                flowingParticlesMaterialRef.current.uniforms
            ) {
                tl.to(
                    flowingParticlesMaterialRef.current.uniforms.uOpacity,
                    {
                        value: 0.0,
                        duration: 1.5,
                        ease: 'power2.inOut',
                    },
                    '>-3'
                );
            }

            // Reveal the final content section
            tl.to(
                '.revealed-content',
                {
                    opacity: 1,
                    duration: 3,
                    ease: 'power2.inOut',
                    onStart: () => setShowStarfield(true),
                    onReverseComplete: () => setShowStarfield(false),
                },
                '<-5'
            );
            // ✨ --- ADD SNAPPING ---
            // Snap during initial phase (rotation and text swap)
            ScrollTrigger.create({
                trigger: '.scroll-container',
                start: 'top top',
                end: '30%', // covers first part of scroll (logo rotation)
                snap: {
                    snapTo: (progress, self) => {
                        const velocity = self.getVelocity(); // positive if scrolling down
                        if (velocity > 0) {
                            // scrolling down → snap forward
                            return 0.33;
                        } else {
                            // scrolling up → snap backward
                            return 0.0;
                        }
                    }, // snap at 1/3 of the scroll progress (adjust as needed)
                    duration: { min: 0.1, max: 1.0 },
                    ease: 'power1.inOut',
                },
            });

            // Snap again near the end (revealed content)
            ScrollTrigger.create({
                trigger: '.scroll-container',
                start: '60%', // when nearing the end
                end: '75%',
                snap: {
                    snapTo: (progress, self) => {
                        const velocity = self.getVelocity();
                        if (velocity > 0) {
                            return 1.0; // snap forward (to starfield)
                        } else {
                            return 0.6; // snap backward (to particle scene)
                        }
                    }, // snap to the very end
                    duration: { min: 0.1, max: 1.0 },
                    ease: 'power1.inOut',
                },
            });
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
            // camera.position.x += (mouseX * 5 - camera.position.x) * 0.02;
            // camera.position.y += (mouseY * 5 - camera.position.y) * 0.02;
            renderer.render(scene, camera);
        }
        renderer.setAnimationLoop(animate);

        // Cleanup function
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            // Dispose of Three.js resources if component unmounts
        };
    }, []);

    return (
        <main className="relative bg-white  font-sans text-black">
            <Navbar />
            <div className="fixed inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                    <FlowingParticles
                        flowAnimation={flowAnimation}
                        materialRef={flowingParticlesMaterialRef}
                    />
                </Canvas>
            </div>

            <canvas ref={canvasRef} className="fixed top-0 left-0 outline-none z-10" />

            {/* ✅ This container will hold all the text content */}
            <div className="fixed inset-0 z-20 pointer-events-none flex items-center justify-center">
                <div className="w-full max-w-6xl mx-auto px-8">
                    <div className="flex justify-between items-center w-full">
                        {/* ✅ Placeholder for the logo space on the left */}
                        <div className="w-1/2"></div>

                        {/* ✅ Initial text on the right */}
                        <div className="w-1/2 initial-text">
                            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-black  ">
                                One small step for <br /> your brand.
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ Second text that appears on top */}
            <div className="fixed inset-x-0 top-[15%] z-20 pointer-events-none opacity-0 second-text text-center">
                <h1 className="text-5xl md:text-7xl font-bold leading-tight text-black">
                    One <span className="text-purple-400">giant leap</span> towards the <br /> hall
                    of fame.
                </h1>
            </div>

            <div className="scroll-container h-[800vh]"></div>

            <div className="h-screen revealed-content fixed inset-0 flex items-center justify-center text-center z-0 opacity-0 isolate">
                {showStarfield && <StarfieldBackground />}
                <h1 className="text-5xl md:text-7xl font-bold">Your New Section</h1>
            </div>
        </main>
    );
};

export default Animation;

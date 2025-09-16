'use client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import StarfieldBackground from '../../components/StarfieldBackground';

gsap.registerPlugin(ScrollTrigger);

function NewCode() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const loader = new THREE.TextureLoader();
        const star = loader.load('/images/sp2.png');

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        camera.position.set(0, 4, 20);
        camera.lookAt(0, 0, 0);
        // Soft global light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        scene.add(ambientLight);

        // HDRI environment handles reflections

        // One key light for stronger shine
        const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
        keyLight.position.set(-10, 10, 10);
        scene.add(keyLight);
        // --- PIE SLICE CREATOR ---
        function createPieSlice(
            innerR,
            outerR,
            angleStart,
            angleEnd,
            thickness = 0.5,
            color = 0xffffff
        ) {
            const shape = new THREE.Shape();
            shape.moveTo(Math.cos(angleStart) * innerR, Math.sin(angleStart) * innerR);
            shape.lineTo(Math.cos(angleStart) * outerR, Math.sin(angleStart) * outerR);
            shape.absarc(0, 0, outerR, angleStart, angleEnd, false);
            shape.lineTo(Math.cos(angleEnd) * innerR, Math.sin(angleEnd) * innerR);
            shape.absarc(0, 0, innerR, angleEnd, angleStart, true);

            const extrudeSettings = {
                depth: thickness,
                bevelEnabled: false,
            };

            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            geometry.rotateX(-Math.PI / 2);

            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color('hsl(280, 100%, 70%)'),
                metalness: 0.5, // strong reflections
                roughness: 0.25, // shininess
                envMapIntensity: 1.5, // boost HDRI reflection
            });

            return new THREE.Mesh(geometry, material);
        }

        // --- CREATE SLICES ---
        const slices = [];
        const sliceCount = 7;
        const radius = 13;
        const angleStart = 0;
        const angleEnd = Math.PI / 4;

        for (let i = 0; i < sliceCount; i++) {
            const slice = createPieSlice(
                0.5,
                radius,
                angleStart,
                angleEnd,
                0.8,
                new THREE.Color('hsl(280, 100%, 70%)')
            );
            slice.rotation.y = -Math.PI;
            // slice.rotation.z = (Math.PI / 2) * 0.5;
            // slice.rotation.x = Math.PI / 8;

            scene.add(slice);
            slices.push(slice);
        }

        // const starCount = 5000;
        // const geometry = new THREE.BufferGeometry();
        // const positions = new Float32Array(starCount * 3);

        // for (let i = 0; i < starCount; i++) {
        //     positions[i * 3] = (Math.random() - 0.5) * 1000; // X spread
        //     positions[i * 3 + 1] = (Math.random() - 0.5) * 1000; // Y spread
        //     positions[i * 3 + 2] = -Math.random() * 1000; // Z depth
        // }
        // geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // const material = new THREE.PointsMaterial({
        //     color: 0xffccff,
        //     size: 10,
        //     map: star,
        //     transparent: true,
        //     opacity: 1,
        //     sizeAttenuation: true,
        // });

        // const stars = new THREE.Points(geometry, material);
        // scene.add(stars);

        // // --- SCROLL BEHAVIOR ---
        function updateSlices() {
            const scrollY = window.scrollY;
            const sectionHeight = window.innerHeight;
            const progress = scrollY / sectionHeight;

            slices.forEach((slice, i) => {
                const offset = i - progress;

                let x = 0;
                let y = 0;
                let z = 0;

                if (offset > 0) {
                    x = offset * 5;
                    y = -offset * 6;
                    z = offset * 2;
                } else if (offset < 0) {
                    x = -offset * 18;
                    y = -offset * 12;
                    z = offset * 2;
                }

                // Scale + fade
                let scale = 1 - Math.abs(offset) * 0.8;
                let opacity = Math.max(1 - Math.abs(offset) * 0.9, 0);
                slice.position.set(x, y, z);

                slice.scale.set(scale, scale, scale);
                slice.material.transparent = false;

                slice.material.opacity = opacity;
            });
        }

        window.addEventListener('scroll', updateSlices);

        // Snap page scroll to each section
        ScrollTrigger.create({
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            snap: {
                snapTo: 1 / (slices.length - 1), // snap per slice
                duration: 0.9, // smooth transition
                ease: 'power2.inOut',
            },
        });

        let mouseX = 0;
        let mouseY = 0;

        const handleMouseMove = event => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);
        new RGBELoader().load('/images/studio_small_03_1k.hdr', hdrMap => {
            hdrMap.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = hdrMap;
            // scene.background = hdrMap;
        });

        // Animate text when section changes
        gsap.utils.toArray('.content').forEach((content, i) => {
            gsap.fromTo(
                content,
                { autoAlpha: 0, opacity: 0 },
                {
                    autoAlpha: 1,
                    opacity: 1,
                    duration: 1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: content,
                        start: 'top 30%',
                        end: 'bottom 70%',
                        toggleActions: 'play reverse play reverse',
                    },
                }
            );
        });
        // const starPositions = geometry.attributes.position.array;

        function animate() {
            updateSlices();
            slices.forEach(slice => {
                slice.position.x += -(mouseX * 10 - slice.position.x) * 0.05;
                slice.position.y += -(mouseY * 5 - slice.position.y) * 0.05;
                slice.position.z += -(mouseY * 5 - slice.position.z) * 0.05;
            });

            // for (let i = 0; i < starCount; i++) {
            //     let z = starPositions[i * 3 + 2];
            //     z += 5; // move stars closer

            //     if (z > 0) {
            //         z = -1000; // recycle far back smoothly
            //     }

            //     starPositions[i * 3 + 2] = z;
            // }
            // stars.rotation.y = -mouseX * 0.02; // rotate left/right
            // stars.rotation.x = -mouseY * 0.02;
            // rotate up/down

            // geometry.attributes.position.needsUpdate = true;
            renderer.render(scene, camera);
        }
        renderer.setAnimationLoop(animate);
    }, []);

    return (
        <div className="relative bg-black text-white">
            {/* 3D Canvas */}
            <StarfieldBackground />

            <canvas
                ref={canvasRef}
                className="fixed top-0 left-0 w-full h-full bg-transparent z-50"
            />

            {/* Scroll Sections */}
            <div className="relative z-100">
                {Array.from({ length: 7 }).map((_, i) => (
                    <section key={i} className=" content h-screen flex items-center justify-end">
                        <div className=" text-center max-w-2xl px-10 ">
                            <h1 className="text-4xl font-bold mb-4">Slice {i + 1} Title</h1>
                            <p className="text-lg">
                                This is the description for slice {i + 1}. You can put your own
                                text, images, or content here to match the slice animation.
                            </p>
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}

export default NewCode;

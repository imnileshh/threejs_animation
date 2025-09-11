'use client';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
const CubeScroll = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const loader = new THREE.TextureLoader();
        const star = loader.load(
            '/images/20250911_1456_Glowing_Star_Circle_simple_compose_01k4w1gveyer2bmw469bmdzym2-removebg-preview.png'
        );

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        });
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 2, 0);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(5, 10, 5);
        scene.add(ambientLight, pointLight);

        function createPieParticles(startAngle, angleSpan, innerRadius, outerRadius, pointCount) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(pointCount * 3);

            for (let i = 0; i < pointCount; i++) {
                // Random angle and radius within the wedge
                const angle = THREE.MathUtils.degToRad(startAngle + Math.random() * angleSpan);
                const radius = innerRadius + Math.random() * (outerRadius - innerRadius);

                // Convert polar to Cartesian (flat on XZ plane)
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                // Optional: small random Y-offset for thickness
                const y = (Math.random() - 0.5) * 0.1;

                // Write the position
                positions[3 * i] = x;
                positions[3 * i + 1] = y;
                positions[3 * i + 2] = z;
            }
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

            const material = new THREE.PointsMaterial({
                color: 'purple',
                size: 0.1,
                sizeAttenuation: true,
                transparent: true,
                opacity: 0.8,
            });

            return new THREE.Points(geometry, material);
        }
        const slices = [];
        const sliceCount = 7;
        const angleSpan = 45; // each slice covers 45 degrees (example)
        const radiusInner = 0.5;
        const radiusOuter = 5.0;
        const verticalGap = 1;

        for (let i = 0; i < sliceCount; i++) {
            // Calculate start angle (e.g., fan out around 360°)
            const startAngle = i * angleSpan;
            const slice = createPieParticles(startAngle, angleSpan, radiusInner, radiusOuter, 500);

            // Position and rotate each slice for artistic layout
            slice.position.y = i * verticalGap;
            slice.rotation.y = THREE.MathUtils.degToRad(-i * 5); // slight rotation per slice
            slices.push(slice);
        }

        slices.map(slice => scene.add(slice));

        const rotY = [
            0,
            1.6,
            3.241592653589793,
            4.7207963267948966,
            2.01 * Math.PI,
            2.52 * Math.PI,
            2.99 * Math.PI,
        ];

        let currentSliceIndex = 0;
        const scrollThreshold = 600; // pixels to scroll before triggering
        window.addEventListener('scroll', () => {
            if (
                window.scrollY > scrollThreshold * (currentSliceIndex + 1) &&
                currentSliceIndex < slices.length
            ) {
                explodeSlice(slices[currentSliceIndex]);
                currentSliceIndex++;

                // Move up the remaining slices
                for (let j = currentSliceIndex; j < slices.length; j++) {
                    // Move each slice up by verticalGap
                    gsap.to(slices[j].position, {
                        y: slices[j].position.y - verticalGap,
                        duration: 1,
                    });
                }
            }
        });
        function explodeSlice(slice) {
            const geometry = slice.geometry;
            const positions = geometry.attributes.position.array;
            const count = positions.length / 3;
            // Displace each particle randomly
            for (let i = 0; i < count; i++) {
                const ix = 3 * i,
                    iy = ix + 1,
                    iz = ix + 2;
                // Push x/z outwards and give a bit of upward motion
                positions[ix] += (Math.random() - 0.5) * 2.0;
                positions[iy] += Math.random() * 2.0;
                positions[iz] += (Math.random() - 0.5) * 2.0;
            }
            geometry.attributes.position.needsUpdate = true;

            // Fade out the slice (optional)
            gsap.to(slice.material, {
                opacity: 0,
                duration: 1,
                onComplete: () => {
                    scene.remove(slice);
                },
            });
        }

        // Animation loop with smooth interpolation between pages
        function animate() {
            const sectionHeight = window.innerHeight || 1;
            const exactPage = scrollY / sectionHeight;
            const pageIndex = Math.floor(exactPage);
            const progress = Math.min(1, Math.max(0, exactPage - pageIndex));

            const startIndex = Math.min(pageIndex, pagesCount - 1);
            const endIndex = Math.min(pageIndex + 1, pagesCount - 1);

            const targetRotY = THREE.MathUtils.lerp(rotY[startIndex], rotY[endIndex], progress);

            if (pageIndex === 0) {
                const reveal = progress; // 0 -> 1 as we scroll down first section
                slices.forEach(slice => {
                    slice.position.z = THREE.MathUtils.lerp(-2, 0, reveal);
                    const scale = THREE.MathUtils.lerp(0.6, 1, reveal);
                    slice.scale.set(scale, scale, scale);
                    slice.material.transparent = true;
                    slice.material.opacity = THREE.MathUtils.lerp(0.3, 1, reveal);
                });
            } else {
                slices.forEach(slice => {
                    slice.position.z = 0;
                    slice.scale.set(1, 1, 1);
                    slice.material.opacity = 1;
                });
            }
            slices.forEach(slice => {
                slice.rotation.y = THREE.MathUtils.lerp(slice.rotation.y, targetRotY, 0.05);
            });
            renderer.render(scene, camera);
        }

        renderer.setAnimationLoop(animate);

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup on unmount
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            geometry.dispose();
            newmaterial.dispose();
            // materials.forEach(m => {
            //     if (m.map) m.map.dispose();
            //     m.dispose();
            // });
        };
    }, []);

    return (
        <div className="relative">
            <canvas
                ref={canvasRef}
                className="fixed top-0 left-0 w-full h-full bg-transparent z-50 "
            />
            {/* Intro (centered) */}
            <div className="h-screen flex items-center justify-center px-8 bg-slate-900 text-white z-100">
                <div className="max-w-3xl text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        The Labyrinth Collection
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 mb-6">
                        Explore a curated selection of craft and culture. Scroll to discover — each
                        chapter reveals a new piece.
                    </p>
                    <div className="inline-flex gap-3">
                        <button className="px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 transition text-white shadow">
                            Get started
                        </button>
                        <a
                            className="px-5 py-2 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-700 transition"
                            href="#learn"
                        >
                            Learn more
                        </a>
                    </div>
                </div>
            </div>

            {/* Section 1: Left aligned */}
            <section className="h-screen flex items-center justify-start px-20 bg-slate-900 text-white">
                <div className="max-w-xl">
                    <h2 className="text-3xl font-semibold mb-2">Section 1 — Folk Pottery</h2>
                    <p className="text-slate-300 mb-4">
                        Hand-painted pottery traditions that carry stories across generations.
                    </p>
                    <div className="mt-4">
                        <button className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400">
                            Learn the craft
                        </button>
                    </div>
                </div>
            </section>

            {/* Section 2: Right aligned */}
            <section className="h-screen flex items-center justify-end px-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                <div className="max-w-xl text-right">
                    <h2 className="text-3xl font-semibold mb-2">Section 2 — Textile Arts</h2>
                    <p className="text-slate-300 mb-4">
                        Intricate weaving patterns that blend color, geometry and memory.
                    </p>
                    <div className="mt-4">
                        <button className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400">
                            View gallery
                        </button>
                    </div>
                </div>
            </section>

            {/* Section 3: Left aligned */}
            <section className="h-screen flex items-center justify-start px-20 bg-slate-900 text-white">
                <div className="max-w-xl">
                    <h2 className="text-3xl font-semibold mb-2">Section 3 — Street Mural</h2>
                    <p className="text-slate-300 mb-4">
                        Public art and muralists bringing color to everyday spaces.
                    </p>
                    <div className="mt-4">
                        <button className="px-4 py-2 rounded bg-pink-600 hover:bg-pink-500">
                            Explore murals
                        </button>
                    </div>
                </div>
            </section>

            {/* Section 4: Right aligned */}
            <section className="h-screen flex items-center justify-end px-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                <div className="max-w-xl text-right">
                    <h2 className="text-3xl font-semibold mb-2">Section 4 — Contemporary Design</h2>
                    <p className="text-slate-300 mb-4">
                        Design experiments mixing tradition and digital fabrication.
                    </p>
                    <div className="mt-4">
                        <button className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400">
                            See projects
                        </button>
                    </div>
                </div>
            </section>

            {/* Section 5: Left aligned (top face) */}
            <section className="h-screen flex items-center justify-start px-20 bg-slate-900 text-white">
                <div className="max-w-xl">
                    <h2 className="text-3xl font-semibold mb-2">Section 5 — Heritage Music</h2>
                    <p className="text-slate-300 mb-4">
                        Fragments and motifs of regional compositions — listen and discover.
                    </p>
                    <div className="mt-4">
                        <button className="px-4 py-2 rounded bg-violet-600 hover:bg-violet-500">
                            Listen
                        </button>
                    </div>
                </div>
            </section>

            {/* Section 6: Right aligned (bottom face) */}
            <section className="h-screen flex items-center justify-end px-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                <div className="max-w-xl text-right">
                    <h2 className="text-3xl font-semibold mb-2">Section 6 — Credits</h2>
                    <p className="text-slate-300 mb-4">
                        Credits, acknowledgements and further reading about the Labyrinth project.
                    </p>
                    <div className="mt-4">
                        <button className="px-4 py-2 rounded bg-rose-500 hover:bg-rose-400">
                            Read credits
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default CubeScroll;

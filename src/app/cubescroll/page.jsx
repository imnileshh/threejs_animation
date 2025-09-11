'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
const CubeScroll = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const loader = new THREE.TextureLoader();

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
        camera.position.z = 5;
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Hollow cube
        function createParticleCube(size = 0, divisions = 0) {
            const positions = [];
            // const step = 1 / divisions; // controls number of points per edge

            // Define cube vertices
            const v = [
                [size / 2, size / 2, size / 2], // 0
                [size / 2, size / 2, -size / 2], // 1
                [size / 2, -size / 2, size / 2], // 2
                [size / 2, -size / 2, -size / 2], // 3
                [-size / 2, size / 2, size / 2], // 4
                [-size / 2, size / 2, -size / 2], // 5
                [-size / 2, -size / 2, size / 2], // 6
                [-size / 2, -size / 2, -size / 2], // 7
            ];

            // Define edges as pairs of vertex indices
            const edges = [
                [0, 1],
                [0, 2],
                [0, 4],
                [7, 6],
                [7, 5],
                [7, 3],
                [1, 5],
                [1, 3],
                [2, 3],
                [2, 6],
                [4, 5],
                [4, 6],
            ];

            // Generate points along edges
            edges.forEach(([a, b]) => {
                const [x1, y1, z1] = v[a];
                const [x2, y2, z2] = v[b];
                positions.push(x1, y1, z1, x2, y2, z2);
            });

            // Create BufferGeometry
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

            // Particle material
            const material = new THREE.LineBasicMaterial({
                color: 0xffffff,
            });

            return new THREE.LineSegments(geometry, material);
        }
        // const cube = createParticleCube(3);
        // scene.add(cube);

        function createPieParticles3D(
            radius = 5,
            angleStart = 0,
            angleEnd = Math.PI / 4,
            density = 50,
            thickness = 0.1, // depth of pie
            color = 0xffffff
        ) {
            const positions = [];

            for (let y = -thickness / 2; y <= thickness / 2; y += thickness / density) {
                for (let r = 0; r <= radius; r += radius / density) {
                    for (let theta = angleStart; theta <= angleEnd; theta += Math.PI / density) {
                        const x = r * Math.cos(theta);
                        const z = r * Math.sin(theta);
                        positions.push(x, y, z); // 3D: add y variation
                    }
                }
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

            const material = new THREE.PointsMaterial({
                size: 0.08,
                color: color,
            });

            return new THREE.Points(geometry, material);
        }

        const pie = createPieParticles3D(5, 0, Math.PI / 4, 50);
        pie.position.set(-4, 0.5, 0);
        scene.add(pie);

        const geometry = new THREE.BoxGeometry(1.6, 1.6, 1.6);

        const newmaterial = new THREE.PointsMaterial({
            sizeAttenuation: true,
            color: 0xffffff,
            size: 0.09,
        });
        const cube = new THREE.Points(geometry, newmaterial);

        // scene.add(cube);

        // Track mouse position
        let mouseX;
        let mouseY;

        const handleMouseMove = event => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Track scroll
        let scrollY = 0;
        const handleScroll = () => {
            scrollY = window.scrollY || window.pageYOffset || 0;
        };
        window.addEventListener('scroll', handleScroll);

        const pageElements = Array.from(document.querySelectorAll('.h-screen'));
        const pagesCount = Math.max(1, pageElements.length);

        const positionsX = [0, 2, -2.5, 2, -2.5, 2, -2.5];
        const positionsY = [0, 0, 0, 0, 0, 0, 0];
        const rotY = [
            0,
            1.6,
            3.241592653589793,
            4.7207963267948966,
            2.01 * Math.PI,
            2.52 * Math.PI,
            2.99 * Math.PI,
        ];

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

                cube.position.z = THREE.MathUtils.lerp(-2, 0, reveal);

                const scale = THREE.MathUtils.lerp(0.6, 1, reveal);
                cube.scale.set(scale, scale, scale);

                newmaterial.transparent = true;
                newmaterial.opacity = THREE.MathUtils.lerp(0.3, 1, reveal);
            } else {
                cube.position.z = 0;
                cube.scale.set(1, 1, 1);
                newmaterial.opacity = 1;
            }

            cube.rotation.y += (targetRotY - cube.rotation.y) * 0.5;
            // pie.rotation.y += (targetRotY - pie.rotation.y) * 0.5;

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
            // dispose geometries/materials/textures
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
            <div className="h-screen flex items-center justify-center px-8 bg-gradient-to-b from-slate-900 to-slate-800 text-white z-100">
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
            <section className="h-screen flex items-center justify-start px-20 bg-slate-800/70 text-white">
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
            <section className="h-screen flex items-center justify-start px-20 bg-slate-800/60 text-white">
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
            <section className="h-screen flex items-center justify-start px-20 bg-slate-800/60 text-white">
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
            <section className="h-screen flex items-center justify-end px-20 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
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

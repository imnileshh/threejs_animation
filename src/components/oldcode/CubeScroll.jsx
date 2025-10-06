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

        renderer.setSize(window.innerWidth, window.innerHeight);
        // document.body.appendChild(renderer.domElement);

        const geometry = new THREE.BoxGeometry(1.6, 1.6, 1.6);

        // const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        function loadColorTexture(path) {
            const texture = loader.load(path);
            texture.colorSpace = THREE.SRGBColorSpace;

            return texture;
        }
        const materials = [
            new THREE.MeshBasicMaterial({
                map: loadColorTexture('/images/9a59a964-90b3-455c-a9b0-85351aec3fd5-thumb.jpeg'),
            }),
            new THREE.MeshBasicMaterial({
                map: loadColorTexture('/images/9a59ad2e-8564-4dad-aa6f-19f61fb93618-thumb.jpeg'),
            }),
            new THREE.MeshBasicMaterial({
                map: loadColorTexture('/images/9a59ad67-2bf5-4f1f-b50e-53e1b962c72d-thumb.jpeg'),
            }),
            new THREE.MeshBasicMaterial({
                map: loadColorTexture('/images/DEA (5).png'),
            }),
            new THREE.MeshBasicMaterial({
                map: loadColorTexture('/images/DEA.png'),
            }),
            new THREE.MeshBasicMaterial({
                map: loadColorTexture(
                    '/images/modern-background-design-abstract-shapes-frame-vertical-banner-random-creative-elements-pattern-card-fluid-brush-strokes-250006128.webp'
                ),
            }),
        ];
        const cube = new THREE.Mesh(geometry, materials);

        scene.add(cube);

        camera.position.z = 3;

        // const controls = new OrbitControls(camera, renderer.domElement);
        // controls.enableDamping = false; // smooth motion
        // controls.dampingFactor = 0.05;
        // controls.enablePan = false; // allow panning
        // controls.enableZoom = false; // allow zooming (scroll)
        // controls.rotateSpeed = 1.5;
        // controls.zoomSpeed = 3.0;
        // controls.panSpeed = 0.8;

        // Track mouse position
        let mouseX;
        let mouseY;

        const handleMouseMove = event => {
            // Normalize mouse position to range [-1, 1]
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

        // Build positions/rotations array based on number of pages
        // We'll count the number of h-screen elements on the page (including the top spacer).
        const pageElements = Array.from(document.querySelectorAll('.h-screen'));
        // If your layout changes, ensure every screen-sized block has class "h-screen"
        const pagesCount = Math.max(1, pageElements.length);
        // console.log(pagesCount, pageElements);

        // Define X positions (zigzag), y offsets (how much cube moves down per page), and rotation for each page.
        // positions[0] is the initial (top) position (center). Then alternate right/left.
        const xLeft = -2.5;
        const xRight = 2;
        const xCenter = 0;

        // Build arrays length = pagesCount
        const positionsX = [0, 2, -2.5, 2, -2.5, 2, -2.5];
        const positionsY = [0, 0, 0, 0, 0, 0, 0];
        const rotY = [
            0,
            1,
            3.741592653589793,
            4.1707963267948966,
            2.18 * Math.PI,
            2.35 * Math.PI,
            3.2 * Math.PI,
        ];

        // Start: centered at top (first h-screen).
        // for (let i = 0; i < pagesCount; i++) {
        //     if (i === 0) {
        //         positionsX.push(xCenter); // initial centered
        //     } else {
        //         // alternate left/right for each subsequent page
        //         positionsX.push(i % 2 === 1 ? xRight : xLeft);
        //     }
        //     // vertical offset in scene units per page (tweak multiplier to taste)
        //     positionsY.push(-i * 0.2); // downward spacing per section (tweak value)
        //     // rotation that shows appropriate face - customize mapping as needed
        //     // simple mapping: front(0), right(PI/2), back(PI), left(-PI/2), repeat...
        //     const r =
        //         i % 4 === 0 ? 0 : i % 4 === 1 ? Math.PI / 2 : i % 4 === 2 ? Math.PI : -Math.PI / 2;
        //     rotY.push(r);
        // }
        // console.log('positionsX', positionsX, 'positionsY', positionsY, 'rotY', rotY);

        // Animation loop with smooth interpolation between pages
        function animate() {
            const sectionHeight = window.innerHeight || 1;
            const exactPage = scrollY / sectionHeight;
            const pageIndex = Math.floor(exactPage);
            const progress = Math.min(1, Math.max(0, exactPage - pageIndex));

            const startIndex = Math.min(pageIndex, pagesCount - 1);
            const endIndex = Math.min(pageIndex + 1, pagesCount - 1);

            const targetX = THREE.MathUtils.lerp(
                positionsX[startIndex],
                positionsX[endIndex],
                progress
            );
            const targetY = THREE.MathUtils.lerp(
                positionsY[startIndex],
                positionsY[endIndex],
                progress
            );
            const targetRotY = THREE.MathUtils.lerp(rotY[startIndex], rotY[endIndex], progress);

            // --- NEW: 3D "reveal" effect only for the first section ---
            if (pageIndex === 0) {
                const reveal = progress; // 0 -> 1 as we scroll down first section

                // Move cube forward in z-axis
                cube.position.z = THREE.MathUtils.lerp(-2, 0, reveal);

                // Scale cube from small to normal
                const scale = THREE.MathUtils.lerp(0.6, 1, reveal);
                cube.scale.set(scale, scale, scale);

                // Fade in materials
                materials.forEach(m => {
                    m.transparent = true;
                    m.opacity = THREE.MathUtils.lerp(0.3, 1, reveal);
                });
            } else {
                // For other sections, keep normal position.z and opacity
                cube.position.z = 0;
                cube.scale.set(1, 1, 1);
                materials.forEach(m => {
                    m.opacity = 1;
                });
            }

            // Smooth X, Y positioning
            cube.position.x += (targetX - cube.position.x) * 0.08;
            cube.position.y += (targetY - cube.position.y) * 0.08;

            // Smooth rotation
            cube.rotation.y += (targetRotY - cube.rotation.y) * 0.5;

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

        // Cleanup on unmount
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            // dispose geometries/materials/textures
            geometry.dispose();
            materials.forEach(m => {
                if (m.map) m.map.dispose();
                m.dispose();
            });
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

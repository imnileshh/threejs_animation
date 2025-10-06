'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export default function TubeEffect() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 2000);
        camera.position.set(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true,
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio || 1);

        // Postprocessing bloom
        // const composer = new EffectComposer(renderer);
        // composer.addPass(new RenderPass(scene, camera));
        // const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 0.85);
        // bloom.strength = 2.0;
        // composer.addPass(bloom);

        // Tunnel config
        const tunnelDepth = 200; // number of repeated outlines
        const spacing = 200; // distance between outlines (same as you used)
        const speedBase = 2.5;
        let speed = speedBase;
        let scrollVelocity = 0;
        let lastScrollY = window.scrollY;

        const visibleCount = 8; // number of stacked ranks to show (1.0, 0.875, ... 0.125)
        const pointSize = 2.0 * (window.devicePixelRatio || 1);

        const loader = new SVGLoader();
        const outlines = [];

        function createShaderMaterial(hue) {
            return new THREE.ShaderMaterial({
                uniforms: {
                    uSpacing: { value: spacing },
                    uVisibleCount: { value: visibleCount },
                    uPointSize: { value: pointSize },
                    uColor: { value: new THREE.Color(`hsl(${hue},100%,70%)`) },
                    uEdge: { value: 0.95 },
                },
                vertexShader: `
          uniform float uPointSize;
          varying float vObjDepth;
          varying vec3 vColor;
          uniform vec3 uColor;

          void main() {
            // Compute the object's origin in view-space (modelViewMatrix * (0,0,0,1))
            vec4 originView = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            // Use absolute z so sign of camera/object doesn't break calculations
            float objDepth = abs(originView.z);
            vObjDepth = objDepth;

            vColor = uColor;

            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            // point size in pixels
            gl_PointSize = uPointSize;
            gl_Position = projectionMatrix * mvPosition;
          }`,
                fragmentShader: `
          precision mediump float;
          uniform float uSpacing;
          uniform float uVisibleCount;
          uniform float uEdge;
          varying float vObjDepth;
          varying vec3 vColor;

          void main() {
            // rank fraction: how many 'spacings' between camera and this outline
            float f = vObjDepth / uSpacing;

            // linear mapping of rank -> alpha; clamp ensures only first 'visibleCount' can have alpha > 0
            float alpha = 1.0 - (f / uVisibleCount);
            alpha = clamp(alpha, 0.0, 1.0);

            // optionally soften the mapping a little (keeps transitions smooth)
            alpha = smoothstep(0.0, 1.0, alpha);

            // draw circular points using gl_PointCoord
            vec2 uv = gl_PointCoord - vec2(0.5);
            float d = length(uv);
            float circle = 1.0 - smoothstep(uEdge - 0.02, uEdge, d);
            if (circle <= 0.0) discard;

            gl_FragColor = vec4(vColor, alpha * circle);
          }`,
                transparent: true,
                depthWrite: false,
                // blending: THREE.AdditiveBlending,
            });
        }

        loader.load('/images/vecteezy_head-line-icon_12791165.svg', data => {
            const paths = data.paths;

            paths.forEach(path => {
                const shapes = SVGLoader.createShapes(path);

                shapes.forEach(shape => {
                    // sample points along the shape
                    const points = shape.getPoints(10);
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);

                    // center & scale exactly like you did
                    geometry.computeBoundingBox();
                    const box = geometry.boundingBox;
                    const center = new THREE.Vector3();
                    box.getCenter(center);
                    geometry.translate(-center.x, -center.y, -center.z);
                    geometry.scale(0.2, 0.2, 0.2);

                    // create many repeated outlines down the z axis
                    for (let i = 0; i < tunnelDepth; i++) {
                        const z = -i * spacing; // same layout you had
                        const mat = createShaderMaterial((i * 8) % 360);
                        const pts = new THREE.Points(geometry, mat);
                        pts.position.z = z;
                        pts.rotation.z = Math.PI;

                        scene.add(pts);
                        outlines.push(pts);
                    }
                });
            });
        });

        // mouse and scroll handlers (unchanged)
        const handleMouseMove = event => {
            /* keep if you use mouse interaction later */
        };
        window.addEventListener('mousemove', handleMouseMove);

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const deltaY = currentScrollY - lastScrollY;
            scrollVelocity += deltaY * 0.05;
            lastScrollY = currentScrollY;
        };
        window.addEventListener('scroll', handleScroll);

        // camera movement instead of per-outline movement
        let cameraZ = camera.position.z;

        function animate() {
            requestAnimationFrame(animate);

            cameraZ -= speed + scrollVelocity;
            camera.position.z = cameraZ;

            // slow down scroll velocity
            scrollVelocity *= 0.95;

            renderer.render(scene, camera);
        }
        animate();

        // cleanup on unmount
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
            outlines.forEach(o => {
                if (o.material) {
                    o.material.dispose();
                }
                if (o.geometry) {
                    o.geometry.dispose();
                }
                scene.remove(o);
            });
            composer.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <main className="relative bg-[radial-gradient(circle_at_center,_#1a1a2e,_#0f0f1f,_#000000)]">
            <canvas ref={canvasRef} className="fixed top-0 left-0 outline-none z-10" />
            <div className="scroll-container h-[500vh]"></div>
            <section className="min-h-screen bg-white text-gray-900 p-16 relative z-20">
                <h2 className="text-4xl font-bold mb-4">The Next Section</h2>
                <p className="text-xl">
                    This content becomes visible when the user scrolls past the animated background.
                </p>
                <div className="h-96 bg-gray-100 mt-8 flex items-center justify-center border rounded">
                    More content here...
                </div>
            </section>
        </main>
    );
}

'use client';
// import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import { EffectComposer } from 'jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'jsm/postprocessing/UnrealBloomPass.js';
import * as THREE from 'three';
import spline from './spline.js';
// import orbitc
import { useEffect, useRef } from 'react';

function TubeEffect() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.3);
        const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
        camera.position.z = 5;
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(w, h);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.03;

        // post-processing
        const renderScene = new RenderPass(scene, camera);
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 100);
        bloomPass.threshold = 0.002;
        bloomPass.strength = 3.5;
        bloomPass.radius = 0;
        const composer = new EffectComposer(renderer);
        composer.addPass(renderScene);
        composer.addPass(bloomPass);

        // create a line geometry from the spline
        const points = spline.getPoints(100);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const line = new THREE.Line(geometry, material);
        // scene.add(line);

        // create a tube geometry from the spline
        const tubeGeo = new THREE.TubeGeometry(spline, 222, 0.65, 16, true);

        // create edges geometry from the spline
        const edges = new THREE.EdgesGeometry(tubeGeo, 0.2);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
        const tubeLines = new THREE.LineSegments(edges, lineMat);
        scene.add(tubeLines);

        const numBoxes = 55;
        const size = 0.075;
        const boxGeo = new THREE.BoxGeometry(size, size, size);
        for (let i = 0; i < numBoxes; i += 1) {
            const boxMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                wireframe: true,
            });
            const box = new THREE.Mesh(boxGeo, boxMat);
            const p = (i / numBoxes + Math.random() * 0.1) % 1;
            const pos = tubeGeo.parameters.path.getPointAt(p);
            pos.x += Math.random() - 0.4;
            pos.z += Math.random() - 0.4;
            box.position.copy(pos);
            const rote = new THREE.Vector3(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            box.rotation.set(rote.x, rote.y, rote.z);
            const edges = new THREE.EdgesGeometry(boxGeo, 0.2);
            const color = new THREE.Color().setHSL(0.7 - p, 1, 0.5);
            const lineMat = new THREE.LineBasicMaterial({ color });
            const boxLines = new THREE.LineSegments(edges, lineMat);
            boxLines.position.copy(pos);
            boxLines.rotation.set(rote.x, rote.y, rote.z);
            // scene.add(box);
            scene.add(boxLines);
        }

        function updateCamera(t) {
            const time = t * 0.1;
            const looptime = 10 * 1000;
            const p = (time % looptime) / looptime;
            const pos = tubeGeo.parameters.path.getPointAt(p);
            const lookAt = tubeGeo.parameters.path.getPointAt((p + 0.03) % 1);
            camera.position.copy(pos);
            camera.lookAt(lookAt);
        }

        function animate(t = 0) {
            requestAnimationFrame(animate);
            updateCamera(t);
            composer.render(scene, camera);
            controls.update();
        }
        animate();

        function handleWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        window.addEventListener('resize', handleWindowResize, false);
    }, []);
    return (
        <main className="relative bg-[radial-gradient(circle_at_center,_#1a1a2e,_#0f0f1f,_#000000)]">
            {/* ✅ Add z-10 to ensure the canvas is on top */}
            <canvas ref={canvasRef} className="fixed top-0 left-0 outline-none z-10" />

            <div className="scroll-container h-[800vh]"></div>

            {/* ✅ MODIFIED: This div is now fixed behind the canvas */}
            <div className="h-[200vh] revealed-content fixed inset-0 flex items-center justify-center text-center z-0 opacity-0 isolate">
                {showStarfield && <StarfieldBackground />}
                <h1 className="text-5xl md:text-7xl font-bold">Your New Section</h1>
            </div>
        </main>
    );
}

export default TubeEffect;

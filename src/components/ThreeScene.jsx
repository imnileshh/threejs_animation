'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
const ThreeScene = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
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
        renderer.setPixelRatio(window.devicePixelRatio);
        camera.position.z = 15;

        const radius = 5;
        const widthSegments = 10;
        const heightSegments = 10;
        const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        const material = new THREE.PointsMaterial({
            sizeAttenuation: false,
            color: 'red',
            size: 5,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        const handleScroll = () => {
            let scrollY = window.scrollY || window.pageYOffset || 0;
        };
        window.addEventListener('scroll', handleScroll);

        let mouseX = 0;
        let mouseY = 0;

        const handleMouseScroll = event => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseScroll);

        function animate() {
            // points.rotation.y += 0.002;
            // points.rotation.x += 0.001;
            points.rotation.z = scrollY * 0.01;
            points.rotation.x = scrollY * 0.05;
            points.rotation.y = scrollY * 0.08;

            const scrollFactor = scrollY * 0.001;

            const scale = Math.max(1, scrollFactor * 0.8 + 1);
            console.log(scale);
            points.scale.set(scale, scale, scale);

            renderer.render(scene, camera);
        }
        renderer.setAnimationLoop(animate);
    }, []);

    return (
        <>
            <div>
                <canvas
                    ref={canvasRef}
                    className="fixed top-0 left-0 w-full h-full bg-transparent z-50"
                ></canvas>
                <div className="h-[300vh]"></div>
            </div>
        </>
    );
};

export default ThreeScene;

'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function StarfieldBackground({}) {
    const canvasRef = useRef(null);

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
        const loader = new THREE.TextureLoader();
        const star = loader.load('/images/sp2.png');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 0;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        // renderer.setClearColor(0x191a4f);

        // 🌌 Create star grid
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        const spacing = 80;
        const count = 22;
        const totalDepth = count * 10;

        for (let x = -count; x <= count; x++) {
            for (let y = -count; y <= count; y++) {
                if (x === 0) continue;
                for (let zLayer = -count; zLayer <= count; zLayer++) {
                    const jitter = (Math.random() - 0.5) * 30;
                    const z = zLayer * 40 + jitter;
                    starPositions.push(x * 100, y * 100, z);
                }
            }
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));

        const total = starPositions.length / 3;
        const sizes = new Float32Array(total);

        let zMin = Infinity,
            zMax = -Infinity;
        for (let i = 0; i < total; i++) {
            const z = starPositions[i * 3 + 2];
            if (z < zMin) zMin = z;
            if (z > zMax) zMax = z;
        }
        const zRange = zMax - zMin || 1.0;

        const minBase = 1.0;
        const maxBase = 14.0;

        for (let i = 0; i < total; i++) {
            const z = starPositions[i * 3 + 2];
            const normalized = (z - zMin) / zRange;
            const biased = Math.pow(normalized, 0.9);
            const base = minBase + biased * (maxBase - minBase);
            sizes[i] = base * (0.85 + Math.random() * 0.35);
        }
        starsGeometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));

        const colors = new Float32Array(total * 3);
        const color = new THREE.Color();

        for (let i = 0; i < total; i++) {
            // ✨ 2. Generate a random color for each star
            color.setHSL(Math.random(), 0.7, 0.6);

            // ✨ 3. Store the R, G, B components in the array
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const starTexture = createCircleTexture();

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: starTexture },
                uSizeScale: { value: 900.0 },
                uStretchX: { value: 1.0 }, // vertical stretch
                uShrinkY: { value: 1.0 }, // horizontal thinness
                uTime: { value: 0 },
                uSpiralProgress: { value: 0 },
                uMergeProgress: { value: 0 },
                vertexColors: true,
            },
            vertexShader: `
       attribute float aSize;
attribute float aSpiral;
attribute vec3 color; // ✨ Add this line to receive the color attribute

varying vec3 vColor;

uniform float uSizeScale;
uniform float uTime;
uniform float uSpiralProgress;
uniform float uMergeProgress;

void main() {
  vec3 pos = position;

  vColor = color;

  // Spiral effect for flagged stars
  if (aSpiral > 0.5) {
    float angle = uTime * 2.0 + pos.z * 0.05;
    float radius = length(pos.xy) * (1.0 - uMergeProgress);

    vec3 spiralPos = vec3(
      cos(angle) * radius,
      sin(angle) * radius,
      pos.z
    );

    pos = mix(pos, spiralPos, uSpiralProgress);
  }

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  float depth = -mvPos.z;
  float safeDepth = max(8.0, depth);
  float perspective = uSizeScale / safeDepth;

  float size = aSize * perspective;
  size = clamp(size, 1.0, 160.0);

  gl_Position = projectionMatrix * mvPos;
  gl_PointSize = size;
}

      `,
            fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uStretchX;
        uniform float uShrinkY;
varying vec3 vColor;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;

          // elongate vertically and shrink horizontally
          uv.x *= uStretchX;
          uv.y /= uShrinkY;

          uv += 0.5;

          vec4 tex = texture2D(uTexture, uv);
          if (tex.a < 0.05) discard;

          gl_FragColor = tex * vec4(vColor, 1.0);
        }
      `,
            transparent: false,
            depthWrite: true,
            blending: THREE.AdditiveBlending,
        });

        const stars = new THREE.Points(starsGeometry, material);
        scene.add(stars);

        let lastScroll = window.scrollY;
        const baseSpeed = 0.5;
        let scrollSpeed = 0;
        window.addEventListener('scroll', () => {
            // stars.position.z = window.scrollY * 0.2;
            // const scrollY = -window.scrollY * 0.2;
            // stars.position.z = -(scrollY % 200); // recycle every 200 unit

            // ✨ Add this line
            const newScroll = window.scrollY;
            const velocity = newScroll - lastScroll;
            lastScroll = newScroll;
            scrollSpeed += velocity * 0.05;

            // tune these multipliers to control thread look
            const stretchX = 1.0 + Math.min(Math.abs(velocity) * 0.08, 30);
            const shrinkY = 1.0 + Math.min(Math.abs(velocity) * 0.05, 15.0);

            gsap.to(material.uniforms.uStretchX, {
                value: stretchX,
                duration: 0.5,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.to(material.uniforms.uStretchX, {
                        value: 1.0,
                        duration: 0.5,
                        ease: 'power2.out',
                    });
                },
            });

            gsap.to(material.uniforms.uShrinkY, {
                value: shrinkY,
                duration: 0.5,
                ease: 'power2.out',
                onComplete: () => {
                    gsap.to(material.uniforms.uShrinkY, {
                        value: 1.0,
                        duration: 0.5,
                        ease: 'power2.out',
                    });
                },
            });
        });
        // 🖱 Mouse parallax
        const mouse = { x: 0, y: 0 };
        document.addEventListener('mousemove', e => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        const animate = () => {
            material.uniforms.uTime.value = performance.now() / 1000;

            const currentSpeed = baseSpeed + scrollSpeed;
            stars.position.z = (stars.position.z + currentSpeed) % totalDepth;
            scrollSpeed *= 0.85;

            camera.position.x += (mouse.x * 15 - camera.position.x) * 0.2;
            camera.position.y += (mouse.y * 15 - camera.position.y) * 0.2;

            renderer.render(scene, camera);
        };
        renderer.setAnimationLoop(animate);

        // Resize
        const onResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(animate);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
            starTexture.dispose();
            material.dispose();
            starsGeometry.dispose();
        };
    }, []);

    return (
        <>
            <div className="h-[3000vh] "></div>
            <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,_#1a1a2e,_#0f0f1f,_#000000)]">
                <canvas ref={canvasRef} className="w-full h-full" />
            </div>
        </>
    );
}

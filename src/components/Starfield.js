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
        camera.position.z = 100;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000);

        // 🌌 Create star grid
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        const spacing = 80;
        const count = 8;

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

        // function randomizeSpiralFlags() {
        //     const total = starsGeometry.attributes.position.count;
        //     const spiralFlags = new Float32Array(total);

        //     for (let i = 0; i < total; i++) {
        //         spiralFlags[i] = Math.random() < 0.25 ? 1.0 : 0.0; // ~25% spiral
        //     }

        //     starsGeometry.setAttribute('aSpiral', new THREE.Float32BufferAttribute(spiralFlags, 1));
        // }

        const starTexture = createCircleTexture();

        //  Shader material with vertical + thin streaks
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: starTexture },
                uSizeScale: { value: 900.0 },
                uStretchX: { value: 1.0 }, // vertical stretch
                uShrinkY: { value: 1.0 }, // horizontal thinness
                uTime: { value: 0 },
                uSpiralProgress: { value: 0 },
                uMergeProgress: { value: 0 },
            },
            vertexShader: `
       attribute float aSize;
attribute float aSpiral;

uniform float uSizeScale;
uniform float uTime;
uniform float uSpiralProgress;
uniform float uMergeProgress;

void main() {
  vec3 pos = position;

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

        void main() {
          vec2 uv = gl_PointCoord - 0.5;

          // elongate vertically and shrink horizontally
          uv.x *= uStretchX;
          uv.y /= uShrinkY;

          uv += 0.5;

          vec4 tex = texture2D(uTexture, uv);
          if (tex.a < 0.05) discard;

          gl_FragColor = tex;
        }
      `,
            transparent: true,
            depthWrite: false,
        });

        const stars = new THREE.Points(starsGeometry, material);
        scene.add(stars);

        // if (spiralTrigger) {
        //     randomizeSpiralFlags();

        //     gsap.to(material.uniforms.uSpiralProgress, {
        //         value: 1,
        //         duration: 3,
        //         ease: 'power2.out',
        //     });

        //     gsap.to(material.uniforms.uMergeProgress, {
        //         value: 1,
        //         duration: 5,
        //         delay: 3,
        //         ease: 'power2.inOut',
        //         onComplete: () => {
        //             document.querySelector('#new-section')?.classList.remove('hidden');
        //         },
        //     });
        // }

        //  Scroll-based stretching

        let lastScroll = window.scrollY;
        window.addEventListener('scroll', () => {
            stars.position.y = window.scrollY * 0.2;

            const scrollY = -window.scrollY * 0.2;
            stars.position.y = -(scrollY % 200); // recycle every 200 unit
            const newScroll = window.scrollY;
            const velocity = newScroll - lastScroll;
            lastScroll = newScroll;

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

        // 🎬 Animation loop

        const animate = () => {
            material.uniforms.uTime.value = performance.now() / 1000;

            camera.position.x += (mouse.x * 10 - camera.position.x) * 0.2;
            camera.position.y += (mouse.y * 5 - camera.position.y) * 0.2;

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
        <div className="fixed inset-0 z-0">
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
}

'use client';

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

export default function AlephScrollScene({ digits = 4, target = 4000, setSpiralTrigger }) {
    const containerRef = useRef(null);
    const digitSlotsRef = useRef([]);
    const stacksRef = useRef([]);
    const numObjRef = useRef({ value: 0 });

    const setStackRef = (el, i) => (stacksRef.current[i] = el);
    const setSlotRef = (el, i) => (digitSlotsRef.current[i] = el);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
        setNumberImmediate(0);

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: 'top top',
                end: '+=2000',
                scrub: true,
                pin: true,
                markers: false,
            },
        });

        // Step 1: reveal digits one by one
        tl.from(digitSlotsRef.current, {
            y: 200,
            opacity: 0,
            duration: 0.9,
            ease: 'sine.inOut',
            stagger: 0.5,
        });

        // Step 2: count up
        const numObj = numObjRef.current;
        numObj.value = 0;
        tl.to(numObj, {
            value: target,
            duration: 5,
            ease: 'bounce.inOut',
            onUpdate: () => {
                updateStacksFromNumber(Math.floor(numObj.value));
                if (Math.floor(numObj.value) >= target) {
                    setSpiralTrigger(true);
                    console.log('target react');
                } else {
                    setSpiralTrigger(false);
                }
            },
        });

        return () => {
            tl.scrollTrigger && tl.scrollTrigger.kill();
            tl.kill();
        };
    }, []);

    function setNumberImmediate(n) {
        const s = String(n).padStart(digits, '0');
        stacksRef.current.forEach((stack, idx) => {
            if (!stack) return;
            const digit = parseInt(s[idx], 10);
            const h = stack.children[0]?.offsetHeight || 64;
            gsap.set(stack, { y: -digit * h });
        });
    }

    function updateStacksFromNumber(n) {
        const s = String(n).padStart(digits, '0');
        stacksRef.current.forEach((stack, idx) => {
            if (!stack) return;
            const digit = parseInt(s[idx], 10);
            const h = stack.children[0]?.offsetHeight || 64;
            gsap.to(stack, {
                y: -digit * h,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true,
            });
        });
    }

    return (
        <div className="h-[400vh] ">
            <div ref={containerRef} className="w-full h-screen flex items-center justify-center  ">
                <div className="flex gap-4 ">
                    {Array.from({ length: digits }).map((_, i) => (
                        <div
                            key={i}
                            ref={el => setSlotRef(el, i)}
                            className="w-14 sm:w-20 md:w-28 h-20  overflow-hidden relative"
                        >
                            <div ref={el => setStackRef(el, i)} className="flex flex-col">
                                {Array.from({ length: 10 }).map((_, d) => (
                                    <div
                                        key={d}
                                        className="text-white text-[48px] md:text-[96px] font-bold h-20 flex items-center justify-center"
                                    >
                                        {d}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

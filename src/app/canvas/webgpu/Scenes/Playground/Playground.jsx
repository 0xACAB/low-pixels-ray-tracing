'use client'; // Indicates that this component is client-side only

import * as THREE from 'three';
import { useEffect, useRef } from 'react';

export default function Playground() {
    const canvas1 = useRef();
    const canvas2 = useRef();
    useEffect(() => {
        const renderer = new THREE.WebGLRenderer({ canvas: canvas1.current });

        // Basic Three.js scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(90, 1 / 1, 1, 1000);

        // Set up the animation loop using setAnimationLoop
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });
        // Cleanup function to dispose of WebGL resources
        return () => {
            // Stop the animation loop
            renderer.setAnimationLoop(null);
        };
    }, []);

    return (
        <div>
            <canvas id="canvas1" width={512} height={512} ref={canvas1}></canvas>
            <canvas id="canvas2" className={`hidden`} ref={canvas2}></canvas>
        </div>
    );
}

'use client'; // Indicates that this component is client-side only

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Playground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        // Initialize the WebGL renderer if it doesn't already exist
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ canvas });

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
        }
    }, []); // Empty dependency array to run effect only on mount and unmount

    return (
        <div>
            <canvas id="canvas" className={`pixelated`} width={512} height={512} ref={canvasRef}></canvas>
        </div>
    );
}

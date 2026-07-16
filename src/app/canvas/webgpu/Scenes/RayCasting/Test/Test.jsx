'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';

import vert from './shaders/vert.glsl';
import frag from './shaders/frag.glsl';
import uniforms from './uniforms';

import Pixelating from '@/components/Pixelating/Pixelating';
import Slider from '@/components/Pixelating/Slider';

export default function Test() {
    const statsRef = useRef(null);
    const canvasRef = useRef(null);
    const pixelatingCanvasRef = useRef(null);
    const resolutions = [
        { width: 8, height: 8 },
        { width: 16, height: 16 },
        { width: 32, height: 32 },
        { width: 64, height: 64 },
        { width: 128, height: 128 },
        { width: 256, height: 256 },
        { width: 512, height: 512 }
    ];
    let currentResolutionIndex = 1;

    let material;
    let pixelating;
    useEffect(() => {
        if (canvasRef.current && pixelatingCanvasRef.current) {
            //Create Stats for fps info
            const stats = new Stats();
            if (statsRef.current) {
                statsRef.current.appendChild(stats.dom);
            }

            //Create controller for plane CanvasTexture
            pixelating = new Pixelating(
                pixelatingCanvasRef.current,
                { vert, frag, uniforms },
                resolutions,
                currentResolutionIndex
            );

            const geometry = new THREE.PlaneGeometry(2.0, 2.0);
            material = new THREE.MeshBasicMaterial();
            material.map = new THREE.CanvasTexture(pixelating.canvas);
            material.map.magFilter = THREE.NearestFilter;
            material.side = THREE.DoubleSide;
            material.transparent = true;
            material.opacity = 0.4;

            const plane = new THREE.Mesh(geometry, material);

            const lineMaterial2 = new THREE.LineBasicMaterial({ color: 0x00ff00 });
            const lineGeometry2 = new THREE.BufferGeometry();
            const line2 = new THREE.Line(lineGeometry2, lineMaterial2);
            const pointsL2 = [new THREE.Vector3(0, 0, 1)];

            const canvas = canvasRef.current;
            const width = canvas.width;
            const height = canvas.height;

            const camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 1000);
            camera.position.z = 2.0;

            //aspect ratio should be 1:1 now
            const cameraPerspective = new THREE.PerspectiveCamera(90, width / height, 1, 1000);
            const helper = new THREE.CameraHelper(cameraPerspective);

            const group = new THREE.Group();
            group.add(plane);
            group.add(line2);

            const scene = new THREE.Scene();
            scene.add(group);
            scene.add(helper);

            const pointer = new THREE.Vector2(-999, -999);
            const rayCaster = new THREE.Raycaster();
            const pointerDown = (event) => {
                // calculate pointer position in normalized device coordinates
                // (-1 to +1) for both components
                const rect = canvas.getBoundingClientRect();
                pointer.x = ((event.clientX - rect.left) / width) * 2 - 1;
                pointer.y = -((event.clientY - rect.top) / height) * 2 + 1;
                rayCaster.setFromCamera(pointer, camera);
                // calculate objects intersecting the picking ray
                const intersects = rayCaster.intersectObjects([plane], false);
                const uv = intersects[0]?.uv;
                if (uv) {
                    const { width, height } = resolutions[currentResolutionIndex];
                    uniforms.iMouse.data = [Math.floor((uv.x - 0.5) * width), Math.floor((uv.y - 0.5) * height)];

                    const xFloored = Math.floor((uv.x - 0.5) * width) / width;
                    const yFloored = Math.floor((uv.y - 0.5) * height) / height;
                    const xHalfPixel = (1 / width) * 0.5;
                    const yHalfPixel = (1 / height) * 0.5;

                    pointsL2[1] = new THREE.Vector3(
                        3 * (xFloored + xHalfPixel) * plane.geometry.parameters.width,
                        3 * (yFloored + yHalfPixel) * plane.geometry.parameters.height,
                        -2
                    );
                    lineGeometry2.setFromPoints(pointsL2);
                }
            };
            canvas.addEventListener('pointerdown', pointerDown);

            const renderer = new THREE.WebGLRenderer({ canvas });
            renderer.setSize(width, height);
            //group.rotation.y = Math.PI/4;
            const animate = (time) => {
                //convert to seconds
                time *= 0.001;
                group.rotation.y -= 0.005;

                cameraPerspective.position.x = -Math.cos(group.rotation.y + Math.PI / 2);
                cameraPerspective.position.z = Math.sin(group.rotation.y + Math.PI / 2);
                cameraPerspective.lookAt(plane.position);
                cameraPerspective.updateProjectionMatrix();

                if (pixelating && material.map) {
                    material.map.needsUpdate = true;
                    pixelating.render(time);
                }
                renderer.render(scene, camera);
                stats.update();
            };

            renderer.setAnimationLoop(animate);

            return () => {
                if (pixelating) {
                    pixelating.unmount();
                }
                renderer.setAnimationLoop(null);
                renderer.forceContextLoss();
            };
        }
    }, []);

    const onChange = (event) => {
        if (pixelating && material.map) {
            currentResolutionIndex = event.target.valueAsNumber;
            uniforms.iMouse.data = [-999, -999];
            material.map.dispose();
            pixelating.onChange(event);
        }
    };
    return (
        <>
            <div ref={statsRef}></div>
            <canvas id="canvas" className={`pixelated`} width={512} height={512} ref={canvasRef}></canvas>
            <canvas id="canvas" className={`hidden`} ref={pixelatingCanvasRef}></canvas>
            <Slider onChange={onChange} resolutions={resolutions} defaultResolution={currentResolutionIndex} />
        </>
    );
}

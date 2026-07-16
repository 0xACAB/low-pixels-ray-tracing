'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';

import shaderCode from './shaders/shader.wgsl';
import uniforms from './uniforms';

import Pixelating from '../../../Pixelating/Pixelating';
import Slider from '../../../Pixelating/Slider';

export default function Triangle() {
    const statsRef = useRef(null);
    const mainCanvasRef = useRef(null);
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
    const startResolutionIndex = 1;
    const [resolutionIndex, setResolutionIndex] = useState(startResolutionIndex);
    const [onChange, setOnChange] = useState();
    useEffect(() => {
        const mainCanvas = mainCanvasRef.current;
        const pixelatingCanvas = pixelatingCanvasRef.current;
        //Create Stats for fps info
        const stats = new Stats();
        if (statsRef.current) {
            statsRef.current.appendChild(stats.dom);
        }

        const geometry = new THREE.PlaneGeometry(2.0, 2.0);
        const material = new THREE.MeshBasicMaterial();
        material.map = new THREE.CanvasTexture(pixelatingCanvas);
        material.map.magFilter = THREE.NearestFilter;
        material.map.flipY = false;
        material.map.premultiplyAlpha = false;
        material.side = THREE.DoubleSide;
        material.transparent = true;
        material.opacity = 0.4;

        const plane = new THREE.Mesh(geometry, material);
        const triangleGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(uniforms.triangle0.points.data);
        triangleGeometry.setIndex([0, 1, 2]);
        triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        const triangleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const triangle = new THREE.Mesh(triangleGeometry, triangleMaterial);
        triangle.material.side = THREE.DoubleSide;

        const lineMaterial2 = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const lineGeometry2 = new THREE.BufferGeometry();
        const line2 = new THREE.Line(lineGeometry2, lineMaterial2);
        const pointsL2 = [new THREE.Vector3(0, 0, 1)];

        const { width, height } = mainCanvas;

        const camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 1000);
        camera.position.z = 2.0;

        //aspect ratio should be 1:1 now
        const cameraPerspective = new THREE.PerspectiveCamera(90, width / height, 1, 1000);
        const helper = new THREE.CameraHelper(cameraPerspective);

        const group = new THREE.Group();
        group.add(plane);
        group.add(triangle);
        group.add(line2);

        const scene = new THREE.Scene();
        scene.add(group);
        scene.add(helper);

        const pointer = new THREE.Vector2(-999, -999);
        const rayCaster = new THREE.Raycaster();

        const renderer = new THREE.WebGLRenderer({ canvas: mainCanvas });
        renderer.setSize(width, height);

        //Create controller for hidden canvas
        const pixelating = new Pixelating(resolutions);
        pixelating.initialize(pixelatingCanvas, { code: shaderCode, uniforms }, startResolutionIndex).then(
            ({ device, objectInfos, changeResolution, render }) => {
                setOnChange(() => (newResolutionIndex) => {
                    material.map.dispose();

                    objectInfos.iMouse.uniformValues.set([-999, -999], 0);
                    device.queue.writeBuffer(objectInfos.iMouse.uniformBuffer, 0, objectInfos.iMouse.uniformValues);

                    changeResolution(newResolutionIndex);
                    setResolutionIndex(newResolutionIndex);
                });
                const pointerDown = (event) => {
                    // calculate pointer position in normalized device coordinates
                    // (-1 to +1) for both components
                    const rect = mainCanvas.getBoundingClientRect();
                    pointer.x = ((event.clientX - rect.left) / width) * 2 - 1;
                    pointer.y = -((event.clientY - rect.top) / height) * 2 + 1;
                    rayCaster.setFromCamera(pointer, camera);
                    // calculate objects intersecting the picking ray
                    const intersects = rayCaster.intersectObjects([plane], false);
                    const uv = intersects[0]?.uv;
                    if (uv) {
                        const { width, height } = pixelating.resolution;

                        objectInfos.iMouse.uniformValues.set(
                            [Math.floor((uv.x - 0.5) * width), Math.floor((uv.y - 0.5) * height)],
                            0
                        );
                        device.queue.writeBuffer(objectInfos.iMouse.uniformBuffer, 0, objectInfos.iMouse.uniformValues);

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
                mainCanvas.addEventListener('pointerdown', pointerDown);
                //group.rotation.y = Math.PI / 4;
                const animate = () => {
                    //convert to seconds
                    group.rotation.y -= 0.005;

                    cameraPerspective.position.x = -Math.cos(group.rotation.y + Math.PI / 2);
                    cameraPerspective.position.z = Math.sin(group.rotation.y + Math.PI / 2);
                    cameraPerspective.lookAt(plane.position);
                    cameraPerspective.updateProjectionMatrix();
                    if (material.map) {
                        material.map.needsUpdate = true;
                        objectInfos.triangle0.uniformValues.set(
                            [
                                ...uniforms.triangle0.points.data.reduce((prev, value, index) => {
                                    prev.push(value);
                                    if (index % 3 === 2) {
                                        //add offset for 16 bytes bufferSize for vec3f
                                        prev.push(0);
                                    }
                                    return prev;
                                }, []),
                                ...uniforms.triangle0.color.data,
                                0,
                                ...uniforms.triangle0.material.Kd.data,
                                0,
                                ...uniforms.triangle0.material.Ke.data,
                                0
                            ],
                            0
                        );
                        device.queue.writeBuffer(
                            objectInfos.triangle0.uniformBuffer,
                            0,
                            objectInfos.triangle0.uniformValues
                        );
                        render();
                    }
                    renderer.render(scene, camera);
                    stats.update();
                };

                renderer.setAnimationLoop(animate);
            },
            (error) => {
                throw error;
            }
        );
        return () => {
            renderer.setAnimationLoop(null);
        };
    }, []);
    return (
        <>
            <div ref={statsRef}></div>
            <canvas id="canvas" width={512} height={512} ref={mainCanvasRef}></canvas>
            <canvas id="canvas" className="hidden" ref={pixelatingCanvasRef}></canvas>
            <Slider resolutions={resolutions} resolutionIndex={resolutionIndex} onChange={onChange} />
        </>
    );
}

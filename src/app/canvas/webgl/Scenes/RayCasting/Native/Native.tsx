'use client';
import { useEffect, useRef, useState } from 'react';
import vert from '../Main/shaders/vert.glsl';
import frag from '../Main/shaders/frag.glsl';
import uniforms from '../Main/uniforms';
import Pixelating from './../../../Pixelating/Pixelating';
import Slider from './../../../Pixelating/Slider';
const resolutions = [
    { width: 8, height: 8 },
    { width: 16, height: 16 },
    { width: 32, height: 32 },
    { width: 64, height: 64 },
    { width: 128, height: 128 },
    { width: 256, height: 256 },
    { width: 512, height: 512 }
];
const startResolutionIndex = 3;
export default function Native() {
    const pixelatingCanvasRef = useRef<HTMLCanvasElement>(null);

    const [resolutionIndex, setResolutionIndex] = useState(startResolutionIndex);
    const [onChange, setOnChange] = useState(() => () => console.log('default ooops'));

    useEffect(() => {
        if (pixelatingCanvasRef.current) {
            //Create controller for plane CanvasTexture
            const pixelating: Pixelating = new Pixelating(
                pixelatingCanvasRef.current,
                { vert, frag, uniforms },
                resolutions[startResolutionIndex]
            );

            setOnChange(() => (newResolutionIndex: number) => {
                if (pixelating) {
                    //uniforms.iMouse.data = [-999, -999];
                    pixelating.onChange(resolutions[newResolutionIndex]);
                }
                setResolutionIndex(newResolutionIndex);
            });

            const pointerDown = (event: MouseEvent) => {
                console.log(event.offsetX, event.offsetY);
            };
            pixelatingCanvasRef.current.addEventListener('pointerdown', pointerDown);

            let animationId: number = 0;
            const render = (time: number) => {
                // convert to seconds
                time *= 0.001;
                if (pixelating) {
                    pixelating.render(time);
                    animationId = requestAnimationFrame(render);
                }
            };
            render(0);
            return () => {
                if (pixelating) {
                    pixelating.unmount();
                }
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            };
        }
    }, []);
    return (
        <div className="flex flex-col items-center">
            <canvas
                id="canvas"
                className={`w-[512px] h-[512px] pixelated`}
                width={512}
                height={512}
                ref={pixelatingCanvasRef}
            ></canvas>
            <Slider resolutions={resolutions} resolutionIndex={resolutionIndex} onChange={onChange} />
        </div>
    );
}

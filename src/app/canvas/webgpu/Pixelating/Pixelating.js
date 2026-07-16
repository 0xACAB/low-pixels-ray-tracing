export default class Pixelating {
    constructor(resolutions) {
        this.resolutions = resolutions;
    }

    initialize = async function (canvas, shader, startResolutionIndex) {
        const adapter = await navigator.gpu?.requestAdapter();
        const device = await adapter?.requestDevice();
        return new Promise((resolve, reject) => {
            if (!device) {
                reject('need a browser that supports WebGPU');
            }

            const context = canvas.getContext('webgpu');

            const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
            context.configure({
                device: device,
                format: presentationFormat
            });

            const shaderModule = device.createShaderModule({
                label: 'shaders',
                code: shader.code
            });

            const pipeline = device.createRenderPipeline({
                label: 'pipeline',
                layout: 'auto',
                vertex: {
                    module: shaderModule
                },
                fragment: {
                    module: shaderModule,
                    targets: [{ format: presentationFormat }]
                }
            });
            const recursiveGetUniformBufferSize = (uniform) => {
                if (Object.prototype.hasOwnProperty.call(uniform, 'bufferSize')) {
                    return uniform.bufferSize;
                } else {
                    return Object.keys(uniform).reduce((prevValues, subUniformName) => {
                        return prevValues + recursiveGetUniformBufferSize(uniform[subUniformName]);
                    }, 0);
                }
            };

            const recursiveGetUniformValues = (uniform) => {
                if (Object.prototype.hasOwnProperty.call(uniform, 'bufferSize')) {
                    return uniform.data;
                } else {
                    return Object.keys(uniform).reduce((prevValues, subUniformName) => {
                        prevValues.push(...recursiveGetUniformValues(uniform[subUniformName]));
                        return prevValues;
                    }, []);
                }
            };

            const setUniforms = (uniforms) => {
                const objectInfos = Object.keys(uniforms).reduce((resultObj, uniformName) => {
                    const uniform = uniforms[uniformName];
                    const uniformBufferSize = recursiveGetUniformBufferSize(uniform);
                    const uniformBuffer = device.createBuffer({
                        label: uniformName,
                        size: uniformBufferSize,
                        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                    });
                    const uniformValues = new Float32Array(uniformBufferSize / 4);
                    uniformValues.set(recursiveGetUniformValues(uniform), 0);
                    resultObj[uniformName] = {
                        uniformName,
                        uniformBuffer,
                        uniformValues
                    };
                    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
                    return resultObj;
                }, {});

                const bindGroup = device.createBindGroup({
                    label: `bind group`,
                    layout: pipeline.getBindGroupLayout(0),
                    entries: Object.keys(objectInfos).map((key, index) => {
                        const { uniformBuffer } = objectInfos[key];
                        return { binding: index, resource: { buffer: uniformBuffer } };
                    })
                });

                return { objectInfos, bindGroup };
            };
            const { objectInfos, bindGroup } = setUniforms({
                ...shader.uniforms,
                iMouse: {
                    bufferSize: 8,
                    data: [-999, -999]
                },
                iScaleWidth: {
                    bufferSize: 4,
                    data: [this.resolutions[startResolutionIndex].width]
                },
                iScaleHeight: {
                    bufferSize: 4,
                    data: [this.resolutions[startResolutionIndex].height]
                }
            });

            const renderPassDescriptor = {
                label: 'our basic canvas renderPass',
                colorAttachments: [
                    {
                        // view: <- to be filled out when we render
                        clearValue: [0.3, 0.3, 0.3, 1],
                        loadOp: 'clear',
                        storeOp: 'store'
                    }
                ]
            };

            const render = function () {
                renderPassDescriptor.colorAttachments[0].view = context.getCurrentTexture().createView();
                const encoder = device.createCommandEncoder({ label: 'our encoder' });
                const pass = encoder.beginRenderPass(renderPassDescriptor);
                pass.setPipeline(pipeline);
                pass.setBindGroup(0, bindGroup);
                pass.draw(6); // call our vertex shader 3 times
                pass.end();
                const commandBuffer = encoder.finish();
                device.queue.submit([commandBuffer]);
            };

            const changeResolution = (resolutionIndex) => {
                const newResolution = this.resolutions[resolutionIndex];
                objectInfos.iScaleWidth.uniformValues.set([newResolution.width], 0);
                device.queue.writeBuffer(
                    objectInfos.iScaleWidth.uniformBuffer,
                    0,
                    objectInfos.iScaleWidth.uniformValues
                );

                objectInfos.iScaleHeight.uniformValues.set([newResolution.height], 0);
                device.queue.writeBuffer(
                    objectInfos.iScaleHeight.uniformBuffer,
                    0,
                    objectInfos.iScaleHeight.uniformValues
                );

                Object.assign(context.canvas, newResolution);
                this.resolution = newResolution;
            };
            changeResolution(startResolutionIndex);
            resolve({ device, objectInfos, changeResolution, render });
        });
    };
}

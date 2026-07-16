const uniforms = {
    camera: {
        type: 'struct',
        data: {
            eye: {
                type: 'uniform3fv',
                data: [0.0, 0.0, 1.0]
            }
        }
    },
    sphere: {
        type: 'struct',
        data: {
            position: {
                type: 'uniform3fv',
                data: [0.0, 0.0, -1.0]
            },
            radius: {
                type: 'uniform1f',
                data: 0.5
            },
            material: {
                type: 'struct',
                data: {
                    Kd: {
                        type: 'uniform3fv',
                        data: [0.6, 0.6, 0.6]
                    },
                    Ke: {
                        type: 'uniform3fv',
                        data: [0.0, 0.0, 0.0]
                    }
                }
            }
        }
    },
    lightSphere: {
        type: 'struct',
        data: {
            position: {
                type: 'uniform3fv',
                data: [2.0, 2.0, 0.0]
            },
            radius: {
                type: 'uniform1f',
                data: 0.05
            },
            material: {
                type: 'struct',
                data: {
                    Kd: {
                        type: 'uniform3fv',
                        data: [0.0, 0.0, 0.0]
                    },
                    Ke: {
                        type: 'uniform3fv',
                        data: [1.0, 1.0, 1.0]
                    }
                }
            }
        }
    },
    iMouse: {
        type: 'uniform2fv',
        data: [-999.0, -999.0]
    }
};
export default uniforms;

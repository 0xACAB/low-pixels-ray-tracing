const uniforms = {
    camera: {
        eye: {
            bufferSize: 16, //12+padding
            data: [0.0, 0.0, 1.0]
        }
    },
    sphere: {
        position: {
            bufferSize: 12,
            data: [0.0, 0.0, -1.0]
        },
        radius: {
            bufferSize: 4,
            data: [0.5]
        },
        material: {
            Kd: {
                bufferSize: 16,
                data: [0.6, 0.6, 0.6]
            },
            Ke: {
                bufferSize: 16,
                data: [0.0, 0.0, 0.0]
            }
        }
    },
    lightSphere: {
        position: {
            bufferSize: 12,
            data: [2.0, 2.0, 0.0]
        },
        radius: {
            bufferSize: 4,
            data: [0.05]
        },
        material: {
            Kd: {
                bufferSize: 16,
                data: [0.0, 0.0, 0.0]
            },
            Ke: {
                bufferSize: 16,
                data: [1.0, 1.0, 1.0]
            }
        }
    }
};
export default uniforms;

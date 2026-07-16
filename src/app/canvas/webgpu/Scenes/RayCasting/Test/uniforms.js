const uniforms = {
    trianglesPoints: {
        name: 'trianglesPoints',
        type: 'uniform3fv',
        data: [
            1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, -1.0, 0.0, 1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0,
            0.0, -1.0, -1.0, 0.0
        ]
    },
    trianglesData: {
        type: 'uniform3iv',
        data: [0, 4, 5, 0, 3, 5, 0, 1, 2, 3, 0, 2, 4, 5, 6, 5, 6, 7, 7, 3, 2, 7, 3, 5, 6, 4, 0, 6, 0, 1]
    },
    trianglesColors: {
        type: 'uniform3fv',
        data: [
            //Cornell box
            //A white back wall
            1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
            //A green right wall
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            //A red left wall
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            //A white floor
            //top
            1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
            //bottom
            1.0, 1.0, 1.0, 1.0, 1.0, 1.0
        ]
    },

    iMouse: {
        type: 'uniform2fv',
        data: [0.0, 0.0]
    }
};
export default uniforms;

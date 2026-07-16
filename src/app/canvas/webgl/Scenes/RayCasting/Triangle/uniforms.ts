const uniforms = {
    trianglePoints: {
        type: 'uniform3fv',
        data: [
            1.0, 1.0, -1.0,

            -1.0, 1.0, -1.0,

            -1.0, -1.0, -1.0
        ]
    },
    indicesData: {
        type: 'uniform3iv',
        data: [0, 1, 2]
    },
    triangleColor: {
        type: 'uniform3fv',
        data: [
            //white triangle
            1.0, 1.0, 1.0
        ]
    },
    iMouse: {
        type: 'uniform2fv',
        data: [-999.0, -999.0]
    }
};
export default uniforms;

struct Camera {
    eye: vec3f
};

struct Material {
    Kd: vec3f,// diffuse color
    Ke: vec3f// emissive color
};

struct Triangle {
    points: array<vec3f, 3>,
    color: vec3f,
    material: Material
};

@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var<uniform> triangle0 : Triangle;
@group(0) @binding(2) var<uniform> iMouse : vec2f;
@group(0) @binding(3) var<uniform> iScaleWidth : f32;
@group(0) @binding(4) var<uniform> iScaleHeight : f32;

struct OurVertexShaderOutput {
    @builtin(position) position: vec4f,
    @location(0) texcoord: vec2f
};
@vertex fn vs(
    @builtin(vertex_index) vertexIndex : u32
) -> OurVertexShaderOutput {
    const pos = array(
        // 1st triangle
        vec2f( -1.0,  -1.0),  // center
        vec2f( 1.0,  -1.0),  // right, center
        vec2f( -1.0,  1.0),  // center, top

        // 2nd triangle
        vec2f( -1.0,  1.0),  // center, top
        vec2f( 1.0,  -1.0),  // right, center
        vec2f( 1.0,  1.0),  // right, top
    );
    var vsOutput: OurVertexShaderOutput;

    let xy = pos[vertexIndex];
    vsOutput.position = vec4f(xy, 0.0, 1.0);

    vsOutput.texcoord = xy;
    return vsOutput;
}

struct Pixel {
    coordinate: vec2<f32>,
    color: vec3<f32>
}

struct Ray {
    origin: vec3f,
    direction: vec3f
}

const FARAWAY: f32 = 1e30;
const trianglesCount = 1;
struct Scene {
    triangles: array<Triangle, trianglesCount>
};

fn triIntersect(R: Ray, T: Triangle) -> vec3f {
    let v1v0 = T.points[1] - T.points[0];
    let v2v0 = T.points[2] - T.points[0];
    let rov0 = R.origin - T.points[0];
    let n  = cross(v1v0, v2v0);
    let q = cross(rov0, R.direction);
    let d = 1.0/dot(R.direction, n);
    let u = d*dot(-q, v2v0);
    let v = d*dot(q, v1v0);
    var t = d*dot(-n, rov0);
    if (u<0.0 || v<0.0 || (u+v)>1.0) {
        t = -1.0;
    }
    return vec3(t, u, v);
}

fn rayTrace(fsInput: OurVertexShaderOutput, scene: Scene) -> vec4<f32> {
    var pixel = Pixel(vec2f(fsInput.texcoord.x, -fsInput.texcoord.y), vec3f(0,0,1));

    var ray: Ray;
    ray.origin = camera.eye;
    ray.direction = normalize(vec3(pixel.coordinate.xy, 0) - camera.eye);

    let tuv = triIntersect(ray, scene.triangles[0]);
    if (tuv.x > 0.0 && tuv.x< FARAWAY) {
        pixel.color = scene.triangles[0].color;
    }

    //Делим на 2 по причине того что 0 в середине и расстояние от 0 до 1 равно половине ширины и высоты текстуры
    if (all(floor(vec2(pixel.coordinate.x*(iScaleWidth/2.0), pixel.coordinate.y*(iScaleHeight/2.0)))==iMouse)) {
        pixel.color = vec3f(1.0, 0.0, 0.0);
    }

    return vec4f(pixel.color, 1);
}

@fragment fn fs(fsInput: OurVertexShaderOutput) -> @location(0) vec4<f32> {
    var scene = Scene(array(triangle0));
    return rayTrace(fsInput, scene);
}
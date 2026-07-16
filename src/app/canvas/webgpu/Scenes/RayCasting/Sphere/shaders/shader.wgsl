struct Camera {
    eye: vec3f
};

struct Material {
    Kd: vec3f,// diffuse color
    Ke: vec3f// emissive color
};

struct Sphere {
    position: vec3f,
    radius: f32,
    material: Material
};

@group(0) @binding(0) var<uniform> camera : Camera;
@group(0) @binding(1) var<uniform> sphere : Sphere;
@group(0) @binding(2) var<uniform> lightSphere : Sphere;
@group(0) @binding(3) var<uniform> iMouse : vec2f;
@group(0) @binding(4) var<uniform> iScaleWidth : f32;
@group(0) @binding(5) var<uniform> iScaleHeight : f32;

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
const spheresCount = 2;
struct Scene {
    spheres: array<Sphere, spheresCount>
};

fn computeSphereIntersection(ray: Ray, sphere: Sphere) -> f32 {
    let a = dot(ray.direction, ray.direction);
    let b = 2.0 * dot(ray.direction, ray.origin - sphere.position);
    let c = dot(ray.origin - sphere.position, ray.origin - sphere.position) - sphere.radius * sphere.radius;
    var t = -1.0;
    let delta = b * b - 4.0 * a * c;
    if (delta >= 0.0) {
        let sqrt_delta = sqrt(delta);
        let t1 = (- b - sqrt_delta) / (2.0 * a);
        let t2 = (- b + sqrt_delta) / (2.0 * a);
        var direction = 1.0;
        if (t1 > 0.0) {
            t = t1;
        } else if (t2 > 0.0) {
            t = t2;
            direction = -1.0;
        } else {
            return t;
        }

        t = (-b-sqrt(delta)) / (2.0*a);
        //ray.origin = ray.origin + t * ray.direction;
        //ray.direction = normalize(ray.origin - sphere.position) * direction;
    }
    return t;
}

fn rayTrace(fsInput: OurVertexShaderOutput, scene: Scene) -> vec4<f32> {
    var pixel = Pixel(vec2f(fsInput.texcoord.x,-fsInput.texcoord.y), vec3f(0,0,1));

    var ray: Ray;
    ray.origin = camera.eye;
    ray.direction = normalize(vec3(pixel.coordinate.xy, 0) - camera.eye);

    for (var i=0; i<spheresCount; i++) {
        let rayLength = computeSphereIntersection(ray, scene.spheres[i]);
        if (rayLength > 0 && rayLength < FARAWAY) {
            //Точка пересечения луча со сферой
            let P = ray.origin + rayLength*ray.direction;
            //Нормаль к этой точке
            let N = normalize(P - scene.spheres[i].position);
            if (all(scene.spheres[i].material.Ke!=vec3<f32>(0.0,0.0,0.0))) {
                pixel.color = scene.spheres[i].material.Ke;
            } else {
                 var result = vec3f(0.0, 0.0, 0.0);
                 for (var j=0; j<spheresCount; j++) {
                    //Для всех сфер являющихся источниками света
                    if (all(scene.spheres[j].material.Ke!=vec3<f32>(0.0,0.0,0.0))) {
                        let E = scene.spheres[j].position - P;
                        let lamb = max(0.0, dot(E, N) / length(E));
                        result += lamb * scene.spheres[i].material.Kd * scene.spheres[j].material.Ke;
                    }
                 }
                 pixel.color = result;
             }
        }
    }

    //Делим на 2 по причине того что 0 в середине и расстояние от 0 до 1 равно половине ширины и высоты текстуры
    if (all(floor(vec2(pixel.coordinate.x*(iScaleWidth/2.0), pixel.coordinate.y*(iScaleHeight/2.0)))==iMouse)) {
        pixel.color = vec3f(1.0, 0.0, 0.0);
    }

    return vec4f(pixel.color, 1);
}

@fragment fn fs(fsInput: OurVertexShaderOutput) -> @location(0) vec4<f32> {
    var scene = Scene(array(sphere, lightSphere));
    return rayTrace(fsInput, scene);
}
#version 300 es
precision lowp float;
in vec2 v_texcoord;
out vec4 outColor;

uniform float iTime;
uniform vec2 iMouse;
uniform float iScaleWidth;
uniform float iScaleHeight;

const float FARAWAY=1e30;
struct Pixel {
    vec2 coordinate;
    vec3 color;
};

struct Camera {
    vec3 eye;
};
uniform Camera camera;

struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Material {
    vec3 Kd;// diffuse color
    vec3 Ke;// emissive color
};

struct Sphere {
    vec3 position;
    float radius;
    Material material;
};
uniform Sphere sphere;
uniform Sphere lightSphere;
struct Scene {
    Sphere spheres[2];
};

struct Intersection {
    float t;
//vec3 P;
//vec3 N;
//Material material;
};

Intersection intersection() {
    Intersection I;
    I.t = FARAWAY;
    return I;
}

Material diffuse(in vec3 Kd) {
    return Material(Kd, vec3(0.0, 0.0, 0.0));
}

Material light(in vec3 Ke) {
    return Material(vec3(0.0, 0.0, 0.0), Ke);
}

float computeSphereIntersection(inout Ray ray, in Sphere sphere) {
    float a = dot(ray.direction, ray.direction);
    float b = 2.0 * dot(ray.direction, ray.origin - sphere.position);
    float c = dot(ray.origin - sphere.position, ray.origin - sphere.position) - sphere.radius * sphere.radius;
    float t = -1.0;
    float delta = b * b - 4.0 * a * c;
    if (delta >= 0.0) {
        float sqrt_delta = sqrt(delta);
        float t1 = (- b - sqrt_delta) / (2.0 * a);
        float t2 = (- b + sqrt_delta) / (2.0 * a);
        float direction = 1.0;
        if (t1 > 0.0) {
            t = t1;
        } else if (t2 > 0.0) {
            t = t2;
            direction = -1.0;
        } else {
            return t;
        }

        t = (-b-sqrt(delta)) / (2.0*a);
        /*ray.origin = ray.origin + t * ray.direction;
        ray.direction = normalize(ray.origin - sphere.position) * direction;*/
    }
    return t;
}

Scene scene;
void init_scene() {
    Sphere scene_spheres[2] = Sphere[2](sphere, lightSphere);
    scene = Scene(scene_spheres);
}

vec3 rayTrace() {
    Pixel pixel = Pixel(v_texcoord, vec3(0.0, 0.0, 1.0));

    Ray ray;
    ray.origin = camera.eye;
    ray.direction = normalize(vec3(pixel.coordinate.xy, 0.0) - camera.eye);

    Intersection I = intersection();

    float rayLength = FARAWAY;
    for (int i=0; i<scene.spheres.length(); i++) {
        float ray_length2 = computeSphereIntersection(ray, scene.spheres[i]);
        if (ray_length2 > 0.0 && ray_length2 < rayLength) {
            rayLength = ray_length2;
            //Точка пересечения луча со сферой
            vec3 P = ray.origin + rayLength*ray.direction;
            //Нормаль к этой точке
            vec3 N = normalize(P - scene.spheres[i].position);
            if (scene.spheres[i].material.Ke != vec3(0.0, 0.0, 0.0)) {
                pixel.color = scene.spheres[i].material.Ke;
            } else {
                vec3 result = vec3(0.0, 0.0, 0.0);
                for (int j=0; j<scene.spheres.length(); ++j) {
                    //Для всех сфер являющихся источниками света
                    if (scene.spheres[j].material.Ke != vec3(0.0, 0.0, 0.0)) {
                        vec3 E = scene.spheres[j].position - P;
                        float lamb = max(0.0, dot(E, N) / length(E));
                        result += lamb * scene.spheres[i].material.Kd * scene.spheres[j].material.Ke;
                    }
                }
                pixel.color = result;
            }
        }
    };

    //Делим на 2 по причине того что 0 в середине и расстояние от 0 до 1 равно половине ширины и высоты текстуры
    if (floor(vec2(pixel.coordinate.x*(iScaleWidth/2.0), pixel.coordinate.y*(iScaleHeight/2.0)))==iMouse) {
        pixel.color = vec3(1.0, 0.0, 0.0);
    }
    return pixel.color;
}

void main(void) {
    init_scene();
    outColor = vec4(rayTrace(), 1.0);
}
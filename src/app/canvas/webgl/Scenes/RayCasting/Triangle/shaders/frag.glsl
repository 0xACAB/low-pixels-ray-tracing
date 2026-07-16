#version 300 es
precision lowp float;
in vec2 v_texcoord;
out vec4 outColor;

uniform float iTime;
uniform vec2 iMouse;
uniform float iScaleWidth;
uniform float iScaleHeight;

#define pointsCount 3
uniform vec3 trianglePoints[pointsCount];
uniform ivec3 indicesData;
uniform vec3 triangleColor;

const float FARAWAY=1e30;
struct Pixel {
    vec2 coordinate;
    vec3 color;
};

struct Camera {
    vec3 eye;
};

struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Material {
    vec3 Kd;// diffuse color
    vec3 Ke;// emissive color
};

struct Triangle {
    vec3 points[3];
    Material material;
};

struct Scene {
    Triangle triangle;
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

Ray initRay(in Pixel pixel, in Camera camera) {
    vec3 direction = normalize(vec3(pixel.coordinate.xy, 0.0) - camera.eye);
    return Ray(camera.eye, direction);
}

vec3 triIntersect(in Ray R, in Triangle T) {
    vec3 v1v0 = T.points[1] - T.points[0];
    vec3 v2v0 = T.points[2] - T.points[0];
    vec3 rov0 = R.origin - T.points[0];
    vec3  n = cross(v1v0, v2v0);
    vec3  q = cross(rov0, R.direction);
    float d = 1.0/dot(R.direction, n);
    float u = d*dot(-q, v2v0);
    float v = d*dot(q, v1v0);
    float t = d*dot(-n, rov0);
    if (u<0.0 || v<0.0 || (u+v)>1.0) t = -1.0;
    return vec3(t, u, v);
}

Scene scene;
void init_scene() {
    scene = Scene(
    Triangle(
    vec3[](
    trianglePoints[indicesData[0]],
    trianglePoints[indicesData[1]],
    trianglePoints[indicesData[2]]
    ),
    Material(vec3(1.0, 1.0, 1.0), triangleColor)
    )
    );
}

Camera camera = Camera(vec3(0.0, 0.0, 1.0));
vec3 rayTrace() {
    Pixel pixel = Pixel(v_texcoord, vec3(0.0, 0.0, 1.0));

    Ray ray;
    ray.origin = camera.eye;
    ray.direction = normalize(vec3(pixel.coordinate.xy, 0.0) - camera.eye);

    Intersection I = intersection();

    vec3 tuv=triIntersect(ray, scene.triangle);
    float t2 = tuv.x;
    if (t2>0.0 && t2<FARAWAY) {
        pixel.color = scene.triangle.material.Ke;
    }

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
#version 300 es
precision lowp float;
in vec2 v_texcoord;
out vec4 outColor;

uniform float iTime;
uniform vec2 iMouse;
uniform float iScaleWidth;
uniform float iScaleHeight;

#define trianglesCount 10
#define pointsCount 8
uniform vec3 trianglesPoints[pointsCount];
uniform ivec3 trianglesData[trianglesCount];
uniform vec3 trianglesColors[trianglesCount];

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

struct Sphere {
    vec3 position;
    float radius;
    Material material;
};

struct Triangle {
    vec3 points[3];
    Material material;
};

struct Scene {
    Triangle triangles[trianglesCount];
    Sphere spheres[3];
};

struct Intersection {
    float t;
//vec3 P;
//vec3 N;
//Material material;
};

struct AABB {
    vec3 min;
    vec3 max;
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

bool segment_box_intersection(
in vec3 q1,
in vec3 dirinv,
in vec3 boxmin,
in vec3 boxmax,
in float t// t of current intersection, used for pruning, see iq's comment.
) {
    // References:
    //    https://tavianator.com/fast-branchless-raybounding-box-intersections/
    vec3 T1 = dirinv*(boxmin - q1);
    vec3 T2 = dirinv*(boxmax - q1);
    vec3 Tmin = min(T1, T2);
    vec3 Tmax = max(T1, T2);
    float tmin = max(max(Tmin.x, Tmin.y), Tmin.z);
    float tmax = min(min(Tmax.x, Tmax.y), Tmax.z);
    return (tmax >= 0.0) && (tmin <= tmax) && (tmin <= t);
}

Scene scene;
void init_scene() {
    Sphere scene_spheres[3];
    Triangle scene_triangles[trianglesCount];
    scene_spheres = Sphere[3](
    Sphere(vec3(0.0, 0.0, 0.5), 0.5, diffuse(vec3(0.6))),
    Sphere(vec3(0.8 * sin(iTime), 0.0, 0.5+0.5*cos(iTime)), 0.2, diffuse(vec3(0.6))),
    Sphere(vec3(0.0, sin(iTime), 0.5+1.0*cos(iTime)), 0.05, light(vec3(1.0, 1.0, 1.0)))
    );
    for (int triangleIndex=0; triangleIndex<scene_triangles.length(); ++triangleIndex) {
        scene_triangles[triangleIndex] = Triangle(
        vec3[](
        trianglesPoints[trianglesData[triangleIndex][0]],
        trianglesPoints[trianglesData[triangleIndex][1]],
        trianglesPoints[trianglesData[triangleIndex][2]]
        ),
        Material(vec3(1.0, 1.0, 1.0), trianglesColors[triangleIndex])
        );
    }
    scene = Scene(scene_triangles, scene_spheres);
}
Camera camera = Camera(vec3(0.0, 0.0, -1.0));
AABB bbox = AABB(vec3(-1.0, -1.0, 1.0), vec3(1.0, 1.0, 0.0));

vec3 rayTrace() {
    //Отразил здесь по y,
    //чтобы совместить координатные оси спрайта на текстуру которого выводится сцена с координатами сцены
    Pixel pixel = Pixel(v_texcoord, vec3(0.0, 0.0, 0.0));

    Ray ray;
    ray.origin = camera.eye;
    ray.direction = normalize(vec3(pixel.coordinate.xy, 0.0) - camera.eye);

    Intersection I = intersection();

    vec3 invDir = vec3(1.0/ray.direction.x, 1.0/ray.direction.y, 1.0/ray.direction.z);
    float ray_length = FARAWAY;
    //if (segment_box_intersection(ray.origin, invDir, bbox.min, bbox.max, I.t)) {
    //Только если прошли ограничение считаем пересечения с треугольниками и сферами
    for (int triangleIndex=0; triangleIndex<scene.triangles.length(); ++triangleIndex) {
        vec3 tuv=triIntersect(ray, scene.triangles[triangleIndex]);
        float t2 = tuv.x;
        if (t2>0.0) {
            if (t2<ray_length){
                pixel.color = scene.triangles[triangleIndex].material.Ke;
            }
            ray_length = t2;
        } else {
            //Цвет AABB
            //pixel.color += vec3(0.4, 0.4, 0.6);
        }
    }


    for (int i=0; i<scene.spheres.length(); i++) {
        float ray_length2 = computeSphereIntersection(ray, scene.spheres[i]);
        if (ray_length2 > 0.0 && ray_length2 < ray_length) {
            ray_length = ray_length2;
            //Точка пересечения луча со сферой
            vec3 P = ray.origin + ray_length*ray.direction;
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

    //}


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
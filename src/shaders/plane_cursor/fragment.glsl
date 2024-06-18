uniform vec2 uMouse;
uniform float uAspect;
uniform float uTime;
uniform vec3 uColor;

varying vec2 vUv;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// gloop distance function
float gloopDistance(vec2 pos, vec2 uv, float uvFactor, float timeFactor, float sizeFactor, float noiseFactor) {
  float uvDistance = distance(pos, uv);
  uvDistance += snoise(((uv * uvFactor) + (uTime * timeFactor)) * sizeFactor) * noiseFactor;
  return uvDistance;
}

void main() {
  vec2 uv = vUv;
  uv.x *= uAspect;

  // mouse position
  float mouseDistance = gloopDistance(uMouse * vec2(uAspect, 1.0), uv, 0.05, 0.005, 30.0, 0.09);

  // interactive balls in scene
  vec2 ballA = vec2(0.75, 0.75);
  ballA *= vec2(uAspect, 1.0);
  float ballADistance = gloopDistance(ballA, uv + vec2(sin(uTime * 0.5) * 0.1, cos(uTime * 0.2) * 0.1), 1.0, 0.07, 2.0, 0.05);

  vec2 ballB = vec2(0.33, 0.25);
  ballB *= vec2(uAspect, 1.0);
  float ballBDistance = gloopDistance(ballB, uv - vec2(sin(uTime * 0.1) * 0.15, cos(uTime * 0.2) * 0.1), 1.0, 0.1, 2.5, 0.02);

  vec2 ballC = vec2(0.05, 0.6);
  ballC +=  vec2(cos(uTime * 0.7) * 0.03, sin(uTime * 0.3) * 0.1);
  ballC *= vec2(uAspect, 1.0);
  float ballCDistance = gloopDistance(ballC, uv, 1.0, 0.05, 1.7, 0.06);

  vec2 ballD = vec2(0.8, 0.02);
  ballD *= vec2(uAspect, 1.0);
  float ballDDistance = gloopDistance(ballD - vec2(cos(uTime) * 0.03, sin(uTime) * 0.07), uv, 1.0, 0.05, 1.7, 0.06);

  // smoothing
  mouseDistance = smin(mouseDistance, ballADistance + 0.08, 0.1);
  mouseDistance = smin(mouseDistance, ballBDistance + 0.2, 0.1);
  mouseDistance = smin(mouseDistance, ballCDistance + 0.15, 0.1);
  mouseDistance = smin(mouseDistance, ballDDistance + 0.12, 0.1);

  float strength = step(0.75, 1.0 - mouseDistance);
  gl_FragColor = vec4(uColor, strength);
}
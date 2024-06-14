uniform vec2 uMouse;
uniform float uAspect;
uniform float uTime;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  uv.x *= uAspect;
  // uv.y += sin(uTime * 0.1) / 5.;
  float strength = step(0.9, 1.0 - distance(uMouse * vec2(uAspect, 1.0), uv));

  gl_FragColor = vec4(strength, 0.0, 0.0, 1.0);
}
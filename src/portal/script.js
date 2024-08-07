import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
// import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

/**
 * Base
 */
// Debug
const gui = new GUI({
	width: 400,
})
const debugObj = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Texture
 */
const bakedTexture = textureLoader.load('baked-2.jpg')
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace

/**
 * Materials
 */
const basicMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 })

const portalVertexShader = `
varying vec2 vUv;
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
}
`
const portalFragmentShader = `
uniform float uTime;
uniform vec3 uColorStart;
uniform vec3 uColorEnd;

varying vec2 vUv;

//	Simplex 3D Noise 
//	by Ian McEwan, Ashima Arts
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //  x0 = x0 - 0. + 0.0 * C 
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
	// noise
	vec2 displacedUv = vUv + snoise(vec3(vUv * 2.0, uTime * 0.1));
	float strength = snoise(vec3(displacedUv * 5.0, uTime * 0.2));
	
	// glow
	float glow = distance(vUv, vec2(0.5)) * 5.0 - 1.5;
	strength += glow;

	strength += step(-0.2, strength) * 0.5;
	strength = clamp(strength, 0.0, 1.0);

	vec3 color = mix(uColorStart, uColorEnd, strength);

  gl_FragColor = vec4(color, 1.0);
}
`

debugObj.uColorEnd = '#c2fcec'
debugObj.uColorStart = '#02defd'
gui.addColor(debugObj, 'uColorStart').onChange(() => {
	portalLightMaterial.uniforms.uColorStart.value.set(debugObj.uColorStart)
})
gui.addColor(debugObj, 'uColorEnd').onChange(() => {
	portalLightMaterial.uniforms.uColorEnd.value.set(debugObj.uColorEnd)
})

const portalLightMaterial = new THREE.ShaderMaterial({
	uniforms: {
		uTime: { value: 0 },
		uColorStart: { value: new THREE.Color(debugObj.uColorStart) },
		uColorEnd: { value: new THREE.Color(debugObj.uColorEnd) },
	},
	vertexShader: portalVertexShader,
	fragmentShader: portalFragmentShader,
	side: THREE.DoubleSide,
})

/**
 * Model
 */

gltfLoader.load(
	'portal.glb',
	(gltf) => {
		// console.log(gltf.scene)
		gltf.scene.traverse((child) => {
			if (child.name === 'poleLightA' || child.name === 'poleLightB') {
				child.material = poleLightMaterial
			} else if (child.name === 'portalLight') {
				child.material = portalLightMaterial
			} else {
				child.material = basicMaterial
			}
		})
		scene.add(gltf.scene)
	},
	() => {},
	(e) => console.error(e)
)

/**
 * Fireflies
 */
const particlesGeometry = new THREE.BufferGeometry()
const particlesCount = 30
const particlesArray = new Float32Array(particlesCount * 3)
const particlesScaleArray = new Float32Array(particlesCount)

for (let i = 0; i < particlesCount; i++) {
	particlesArray[i * 3] = (Math.random() - 0.5) * 4
	particlesArray[i * 3 + 1] = Math.random() * 1.5
	particlesArray[i * 3 + 2] = (Math.random() - 0.5) * 4
	particlesScaleArray[i] = Math.random()
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesArray, 3))

particlesGeometry.setAttribute('aScale', new THREE.BufferAttribute(particlesScaleArray, 1))

const particlesVertexShader = `
uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;

attribute float aScale;

void main() {
	vec4 modelPosition = modelMatrix * vec4(position, 1.0);
	modelPosition.y += sin(uTime + modelPosition.x * 100.0) * aScale * 0.15;

	vec4 viewPosition = viewMatrix * modelPosition;
	vec4 projectionPosition = projectionMatrix * viewPosition;

	gl_Position = projectionPosition;
	gl_PointSize = uSize * uPixelRatio * aScale;
	gl_PointSize *= (1.0 / -viewPosition.z);
}
`

const particlesFragmentShader = `
void main() {
	float centerDistance = distance(gl_PointCoord, vec2(0.5));
	float strength = max(0.0, 0.05 / centerDistance - 0.1); // pixel renderer has weird bug?
	gl_FragColor = vec4(1.0, 1.0, 1.0, strength);
}
`

const particlesMaterial = new THREE.ShaderMaterial({
	vertexShader: particlesVertexShader,
	fragmentShader: particlesFragmentShader,
	uniforms: {
		uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
		uSize: { value: 100 },
		uTime: { value: 0 },
	},
	transparent: true,
	depthWrite: false,
	blending: THREE.AdditiveBlending,
	depthTest: true,
})
gui.add(particlesMaterial.uniforms.uSize, 'value', 0, 400, 1).name('uSize')

const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}

window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	// Update camera
	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	// Update renderer
	renderer.setSize(sizes.width, sizes.height)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	effectComposer.setSize(sizes.width, sizes.height)
	effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

	// Update particles
	particlesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

debugObj.clearColor = '#5f6c44'
renderer.setClearColor(debugObj.clearColor)
gui.addColor(debugObj, 'clearColor').onChange(() => {
	renderer.setClearColor(debugObj.clearColor)
})

const renderTarget = new THREE.WebGLRenderTarget(800, 600)

const effectComposer = new EffectComposer(renderer, renderTarget)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
effectComposer.setSize(sizes.width, sizes.height)

debugObj.pixelSize = 5
const renderPass = new RenderPixelatedPass(debugObj.pixelSize, scene, camera)

effectComposer.addPass(renderPass)
gui.add(debugObj, 'pixelSize', 0.9, 40, 1).onChange(() => {
	renderPass.setPixelSize(debugObj.pixelSize)
})
gui.add(renderPass, 'depthEdgeStrength', 0, 1, 0.01)
gui.add(renderPass, 'normalEdgeStrength', 0, 1, 0.01)

const outputPass = new OutputPass()
effectComposer.addPass(outputPass)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
	const elapsedTime = clock.getElapsedTime()

	// Uniforms
	particlesMaterial.uniforms.uTime.value = elapsedTime
	portalLightMaterial.uniforms.uTime.value = elapsedTime

	// Update controls
	controls.update()

	// Render
	// renderer.render(scene, camera)
	effectComposer.render()

	// Call tick again on the next frame
	window.requestAnimationFrame(tick)
}

tick()

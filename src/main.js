import * as THREE from 'three'
import cursorVertexShader from './shaders/plane_cursor/vertex.glsl'
import cursorFragmentShader from './shaders/plane_cursor/fragment.glsl'

const canvas = document.querySelector('canvas.webgl')

const scene = new THREE.Scene()

const geometry = new THREE.PlaneGeometry(2, 2)
const material = new THREE.ShaderMaterial({
	vertexShader: cursorVertexShader,
	fragmentShader: cursorFragmentShader,
	uniforms: {
		uMouse: new THREE.Uniform(new THREE.Vector2(0, 0)),
		uAspect: new THREE.Uniform(window.innerWidth / window.innerHeight),
		uTime: new THREE.Uniform(0),
	},
})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}

window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	// Update camera
	// camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	// Update renderer
	renderer.setSize(sizes.width, sizes.height)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

	material.uniforms.uAspect.value = sizes.width / sizes.height
})

const mouse = new THREE.Vector2()
window.addEventListener('mousemove', (e) => {
	mouse.x = e.clientX / sizes.width
	mouse.y = 1 - e.clientY / sizes.height

	material.uniforms.uMouse.value.x = mouse.x
	material.uniforms.uMouse.value.y = mouse.y
})

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
scene.add(camera)

const renderer = new THREE.WebGLRenderer({
	canvas,
	antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const clock = new THREE.Clock()
const tick = () => {
	material.uniforms.uTime.value = clock.getElapsedTime()
	renderer.render(scene, camera)
	window.requestAnimationFrame(tick)
}

tick()

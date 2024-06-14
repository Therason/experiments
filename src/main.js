import * as THREE from 'three'

const canvas = document.querySelector('canvas.webgl')

const scene = new THREE.Scene()

const geometry = new THREE.PlaneGeometry(2, 2)
const material = new THREE.MeshBasicMaterial({ color: 'blue' })
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
})

const mouse = new THREE.Vector2()
window.addEventListener('mousemove', (e) => {
	mouse.x = (e.clientX / sizes.width) * 2 - 1
	mouse.y = -(e.clientY / sizes.height) * 2 + 1
})

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
scene.add(camera)

const renderer = new THREE.WebGLRenderer({
	canvas,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const clock = new THREE.Clock()
const tick = () => {
	renderer.render(scene, camera)
	window.requestAnimationFrame(tick)
}

tick()

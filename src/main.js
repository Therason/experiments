import * as THREE from 'three'
import gsap from 'gsap'
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
		uColor: new THREE.Uniform(new THREE.Color('#B13F0E').convertLinearToSRGB()),
	},
	transparent: true,
	depthWrite: false,
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
	camera.updateProjectionMatrix()

	// Update renderer
	renderer.setSize(sizes.width, sizes.height)
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

	material.uniforms.uAspect.value = sizes.width / sizes.height
})

const githubIcon = document.querySelector('.lucide-github')
const mouse = new THREE.Vector2()
window.addEventListener('mousemove', (e) => {
	gsap.to(mouse, {
		duration: 1,
		x: e.clientX / sizes.width,
		y: 1 - e.clientY / sizes.height,
		ease: 'power2.out',
		onUpdate: () => {
			material.uniforms.uMouse.value.set(mouse.x, mouse.y)
		},
	})

	// magnetic icon
	const iconRect = githubIcon.getBoundingClientRect()
	const iconCenterX = iconRect.left + iconRect.width / 2
	const iconCenterY = iconRect.top + iconRect.height / 2

	const dx = e.clientX - iconCenterX
	const dy = e.clientY - iconCenterY
	const distance = Math.sqrt(dx * dx + dy * dy)

	if (distance < 100) {
		const magnetEffectX = (dx * 0.1) / distance
		const magnetEffectY = (dy * 0.1) / distance
		gsap.to(githubIcon, {
			x: magnetEffectX * (100 - distance),
			y: magnetEffectY * (100 - distance),
			ease: 'power3.out',
			overwrite: true,
		})
	} else {
		gsap.to(githubIcon, {
			x: 0,
			y: 0,
			ease: 'power2.out',
			overwrite: true,
		})
	}
})

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
scene.add(camera)

const renderer = new THREE.WebGLRenderer({
	canvas,
	antialias: true,
	alpha: true,
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

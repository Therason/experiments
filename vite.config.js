import glsl from 'vite-plugin-glsl'

export default {
	root: 'src/',
	publicDir: '../public/',
	base: '/experiments',
	plugins: [glsl()],
}

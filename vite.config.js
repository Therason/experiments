import glsl from 'vite-plugin-glsl'

export default {
	root: 'src/',
	publicDir: '../public/',
	base: '/experiments',
	plugins: [glsl()],
	build: {
		rollupOptions: {
			input: {
				main: './src/index.html',
				portal: './src/portal/index.html',
			},
		},
	},
}

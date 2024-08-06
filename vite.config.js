import glsl from 'vite-plugin-glsl'

export default {
	root: 'src/',
	publicDir: '../public/',
	base: '/experiments',
	plugins: [glsl()],
	build: {
		rollupOptions: {
			input: ['index.html', 'about.html'],
			output: {
				entryFileNames: ['index.html', 'about.html'],
			},
		},
	},
}

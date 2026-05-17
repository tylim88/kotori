import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['src/**/*.test.{ts,tsx}'],
		coverage: {
			enabled: true,
			include: ['src/index.ts'],
		},
		environment: 'happy-dom',
		typecheck: {
			enabled: true,
			include: ['src/**'],
		},
	},
})

// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://zerolingg.github.io',
	base: '/ZEROLINGG/',
	integrations: [
		starlight({
			title: 'ZEROLINGG',
			description: 'Security-minded systems programmer · Rust tool builder',
			customCss: ['./src/styles/custom.css'],
			head: [
				{ tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
				{ tag: 'meta', attrs: { property: 'og:site_name', content: 'ZEROLINGG' } },
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://zerolingg.github.io/ZEROLINGG/og.png' } },
				{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
				{ tag: 'meta', attrs: { name: 'twitter:image', content: 'https://zerolingg.github.io/ZEROLINGG/og.png' } },
			{ tag: 'meta', attrs: { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#faf4ed' } },
			{ tag: 'meta', attrs: { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#1f1d2b' } },
		],
		expressiveCode: {
			themes: ['rose-pine-moon', 'rose-pine-dawn'],
		},
			lastUpdated: true,
			editLink: {
				baseUrl: 'https://github.com/ZEROLINGG/ZEROLINGG/edit/main/',
			},
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/ZEROLINGG' }],
			sidebar: [
				{
					label: 'About',
					items: [{ label: 'About Me', slug: 'about' }],
				},
				{
					label: 'Writeups',
					items: [{ autogenerate: { directory: 'writeups' } }],
				},
			],
		}),
	],
});

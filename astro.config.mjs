// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightBlog from 'starlight-blog';
import rehypeMermaid from 'rehype-mermaid';

// https://astro.build/config
export default defineConfig({
	site: 'https://zerolingg.github.io',
	base: '/ZEROLINGG/',
	markdown: {
		syntaxHighlight: {
			type: 'shiki',
			excludeLangs: ['mermaid'],
		},
		rehypePlugins: [
			[
				rehypeMermaid,
				{
					strategy: 'img-svg',
					mermaidConfig: {
						theme: 'base',
						themeVariables: {
							background: '#fffaf3',
							primaryColor: '#f2e9e1',
							primaryTextColor: '#575279',
							primaryBorderColor: '#d7827e',
							lineColor: '#6e6a86',
							secondaryColor: '#f5e3e1',
							tertiaryColor: '#fffaf3',
							fontFamily: 'arial,sans-serif',
						},
					},
					dark: {
						theme: 'base',
						themeVariables: {
							darkMode: true,
							background: '#1f1d2b',
							primaryColor: '#2a273f',
							primaryTextColor: '#e0def4',
							primaryBorderColor: '#c4a7e7',
							lineColor: '#908caa',
							secondaryColor: '#393552',
							tertiaryColor: '#242230',
							fontFamily: 'arial,sans-serif',
						},
					},
					errorFallback: (element, diagram, error) => {
						console.warn('[rehype-mermaid] failed to render diagram:', error);
					},
				},
			],
		],
	},
	integrations: [
		starlight({
			title: 'ZEROLINGG',
			description: 'Security-minded systems programmer · Rust tool builder',
			plugins: [
				starlightBlog({
					title: 'Blog',
					authors: {
						zerolingg: {
							name: 'ZEROLINGG',
							url: 'https://github.com/ZEROLINGG',
						},
					},
				}),
			],
			customCss: ['./src/styles/custom.css'],
			head: [
				{ tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
				{ tag: 'meta', attrs: { property: 'og:site_name', content: 'ZEROLINGG' } },
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://zerolingg.github.io/ZEROLINGG/og.png' } },
				{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
				{ tag: 'meta', attrs: { name: 'twitter:image', content: 'https://zerolingg.github.io/ZEROLINGG/og.png' } },
			{ tag: 'meta', attrs: { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#faf4ed' } },
			{ tag: 'meta', attrs: { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#1f1d2b' } },
			{ tag: 'script', attrs: { src: '/ZEROLINGG/mermaid-theme-swap.js', defer: true } },
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
					label: 'Blog',
					items: [{ label: 'All posts', link: '/blog/' }],
				},
				{
					label: 'Knowledge',
					items: [{ autogenerate: { directory: 'knowledge' } }],
				},
				{
					label: 'Writeups',
					items: [{ autogenerate: { directory: 'writeups' } }],
				},
			],
		}),
	],
});

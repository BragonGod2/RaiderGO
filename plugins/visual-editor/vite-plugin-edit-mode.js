import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { EDIT_MODE_STYLES, POPUP_STYLES } from './visual-editor-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

export default function inlineEditDevPlugin() {
	return {
		name: 'vite:inline-edit-dev',
		apply: 'serve',
		transformIndexHtml() {
			const scriptPath = resolve(__dirname, 'edit-mode-script.js');
			let scriptContent = readFileSync(scriptPath, 'utf-8');

			// Replace the relative import with inlined constant to avoid 404 on deep routes
			scriptContent = scriptContent.replace(
				/import\s*{\s*POPUP_STYLES\s*}\s*from\s*["']\.\/visual-editor-config\.js["'];?/,
				`const POPUP_STYLES = ${JSON.stringify(POPUP_STYLES)};`
			);

			return [
				{
					tag: 'script',
					attrs: { type: 'module' },
					children: scriptContent,
					injectTo: 'body'
				},
				{
					tag: 'style',
					children: EDIT_MODE_STYLES,
					injectTo: 'head'
				}
			];
		}
	};
}

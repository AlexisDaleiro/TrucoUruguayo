import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config({ ignores: ['**/dist/**', '**/node_modules/**', '.wrangler/**', 'coverage/**', '**/android/**', '.unlighthouse/**'] }, js.configs.recommended, ...ts.configs.recommended, {files:['**/*.{js,mjs,ts,tsx}'], languageOptions:{globals:{process:'readonly',console:'readonly', URL:'readonly', setTimeout:'readonly', clearTimeout:'readonly', fetch:'readonly', Buffer:'readonly'}},rules:{'@typescript-eslint/no-explicit-any':'error'}});

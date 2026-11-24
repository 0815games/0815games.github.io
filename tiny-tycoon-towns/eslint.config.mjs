import globals from 'globals';
export default [{ files: ['**/*.js','**/*.mjs'], languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.browser } }, rules: { 'no-undef': 'error' } }];

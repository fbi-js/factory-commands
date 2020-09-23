"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getESLintConfig = void 0;
const eslint_1 = require("eslint");
const path_1 = require("path");
async function getESLintConfig(filePath, factory) {
    const eslintOptions = {};
    if (filePath) {
        eslintOptions.cwd = path_1.dirname(filePath);
    }
    const eslint = new eslint_1.ESLint({});
    try {
        factory.debug(`getting eslint config for file at "${filePath}"`);
        const config = await eslint.calculateConfigForFile(filePath);
        return {
            ...eslintOptions,
            ...config
        };
    }
    catch (error) {
        // is this noisy? Try setting options.disableLog to false
        factory.debug('Unable to find config');
        return { overrideConfig: { rules: {} } };
    }
}
exports.getESLintConfig = getESLintConfig;

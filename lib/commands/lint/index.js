"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fbi_1 = require("fbi");
const path_1 = require("path");
const eslint_1 = require("eslint");
const defaults_json_1 = tslib_1.__importDefault(require("./defaults.json"));
class CommandDemo extends fbi_1.Command {
    constructor(factory) {
        super();
        this.factory = factory;
        this.id = 'lint';
        this.alias = '';
        this.description = 'code lint with eslint';
        this.args = '';
        this.flags = [['--fix', 'autofix', false]];
    }
    async run(flags, unknow) {
        this.debug(`Factory: (${this.factory.id})`, 'from command', `"${this.id}" with options:`, {
            flags,
            unknow
        });
        const { fix } = flags;
        const pkgDir = path_1.join(__dirname, '../../../node_modules/eslint-plugin-fbi');
        const configs = {
            ...defaults_json_1.default,
            resolvePluginsRelativeTo: pkgDir,
            fix
        };
        this.debug(JSON.stringify(configs, null, 2));
        const eslint = new eslint_1.ESLint(configs);
        const results = await eslint.lintFiles('./');
        const formatter = await eslint.loadFormatter('stylish');
        const messages = formatter.format(results);
        console.log(messages);
    }
}
exports.default = CommandDemo;

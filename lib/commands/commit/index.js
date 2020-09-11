"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fbi_1 = require("fbi");
const entry_1 = tslib_1.__importDefault(require("./entry"));
class CommandCommit extends fbi_1.Command {
    constructor(factory) {
        super();
        this.id = 'commit';
        this.alias = 'c';
        this.description = 'git commit and version release toolkit';
        this.args = '';
        this.flags = [];
    }
    async run(flags) {
        console.log('----in command commit');
        await entry_1.default();
    }
}
exports.default = CommandCommit;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = require("path");
const fbi_1 = require("fbi");
const commit_1 = tslib_1.__importDefault(require("./commands/commit"));
const lint_1 = tslib_1.__importDefault(require("./commands/lint"));
class FactoryCommands extends fbi_1.Factory {
    constructor() {
        super(...arguments);
        this.id = 'factory-commands';
        this.description = 'global commands for fbi';
        this.commands = [new commit_1.default(this), new lint_1.default(this)];
        this.templates = [];
        this.isGlobal = true;
        this.execOpts = {
            cwd: process.cwd(),
            localDir: path_1.join(__dirname, '../'),
            preferLocal: true
        };
    }
}
exports.default = FactoryCommands;

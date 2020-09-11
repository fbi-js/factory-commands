"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fbi_1 = require("fbi");
class CommandDemo extends fbi_1.Command {
    constructor(factory) {
        super();
        this.id = 'demo';
        this.alias = '';
        this.description = 'demo command';
        this.args = '';
        this.flags = [];
    }
    async run(flags) {
        console.log('----in command demo');
    }
}
exports.default = CommandDemo;

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fbi_1 = require("fbi");
const entry_1 = require("./entry");
class CommandCommit extends fbi_1.Command {
    constructor(factory) {
        super();
        this.id = 'commit';
        this.alias = 'c';
        this.description = 'git commit and version release toolkit';
        this.args = '';
        this.flags = [];
    }
    run(flags) {
        return __awaiter(this, void 0, void 0, function* () {
            yield entry_1.default();
        });
    }
}
exports.default = CommandCommit;

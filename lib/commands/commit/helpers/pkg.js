"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readPkg = exports.pkgExist = void 0;
const path = require('path');
const root = process.cwd();
async function pkgExist() {
    // return ctx.utils.fs.exist(path.join(root, 'package.json'))
    // TODO: do real logic
    return true;
}
exports.pkgExist = pkgExist;
function readPkg() {
    return require(path.join(root, 'package.json'));
}
exports.readPkg = readPkg;

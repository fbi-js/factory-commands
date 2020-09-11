"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inquirer = tslib_1.__importStar(require("inquirer"));
const standard_version_1 = tslib_1.__importDefault(require("standard-version"));
const pkg_1 = require("./pkg");
const standard_version_json_1 = tslib_1.__importDefault(require("../configs/standard-version.json"));
async function bumpVersion() {
    try {
        await standard_version_1.default(standard_version_json_1.default);
    }
    catch (err) {
        console.error(`standard-version failed with message: ${err.message}`);
    }
}
async function bump() {
    if (await pkg_1.pkgExist()) {
        const answerBump = await inquirer.prompt({
            type: 'confirm',
            name: 'bumpVersion',
            message: 'Bump the package version?',
            default: false
        });
        if (answerBump && answerBump.bumpVersion) {
            await bumpVersion();
        }
    }
}
exports.default = {
    bump
};

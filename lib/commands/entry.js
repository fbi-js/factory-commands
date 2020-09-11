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
const inquirer = require('inquirer');
const version = require('../lib/version');
const commit = require('../lib/commit');
const publish = require('../lib/publish');
const { isGitRepo, getStatus, getUnpushedCommits, push, gitInit } = require('../lib/git');
const { pkgExist, readPkg } = require('../lib/pkg');
process.on('unhandledRejection', (reason, promise) => {
    //ctx.logger.error(
    //   "Unhandled Rejection at: Promise ",
    //   promise,
    //   " reason: ",
    //   reason
    // );
    throw reason;
});
process.on('uncaughtException', (error) => __awaiter(void 0, void 0, void 0, function* () {
    //ctx.logger.error(error);
    process.exit(0);
}));
const defaults = {
    repoPath: process.cwd()
};
function entry(options = defaults) {
    return __awaiter(this, void 0, void 0, function* () {
        // prevent additional parameters results in an git git error
        process.argv = process.argv.slice(0, 3);
        if (!(yield isGitRepo(options.repoPath))) {
            yield gitInit();
        }
        try {
            const hadCommited = yield commit(options);
            if (hadCommited) {
                //ctx.logger.success("Selected files committed\n");
            }
            // bump version
            yield version.bump();
            // push
            const unPushed = yield getUnpushedCommits();
            if (unPushed) {
                console.log();
                // //ctx.logger.info(
                //   `Unpushed commits(${unPushed.split("\n").filter((u) => u).length}):`
                // );
                console.log(unPushed);
                const answer = yield inquirer.prompt({
                    type: 'confirm',
                    name: 'pushCommits',
                    message: 'Do you want to push now?',
                    default: false
                });
                if (answer.pushCommits) {
                    yield push();
                    yield push('--tags');
                    //ctx.logger.success("All commits and tags pushed\n");
                }
            }
            // publish
            if (yield pkgExist()) {
                const pkg = readPkg();
                if (!pkg.private) {
                    yield publish(pkg);
                }
            }
            // status
            yield getStatus();
            const unPushed2 = yield getUnpushedCommits();
            if (unPushed2) {
                console.log(` (${unPushed2.split('\n').filter((u) => u).length} commits unpushed)`);
            }
            console.log();
        }
        catch (err) {
            console.log(err);
            //ctx.logger.error(err);
            process.exit(0);
        }
    });
}
exports.default = entry;

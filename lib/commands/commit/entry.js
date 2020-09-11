"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const inquirer_1 = tslib_1.__importDefault(require("inquirer"));
const version_1 = tslib_1.__importDefault(require("./helpers/version"));
const commit_1 = tslib_1.__importDefault(require("./helpers/commit"));
const publish_1 = tslib_1.__importDefault(require("./helpers/publish"));
const git_1 = require("./helpers/git");
const pkg_1 = require("./helpers/pkg");
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at: Promise ', promise, ' reason: ', reason);
    throw reason;
});
process.on('uncaughtException', async (error) => {
    console.error(error);
    process.exit(0);
});
const defaults = {
    repoPath: process.cwd()
};
async function entry(options = defaults) {
    // prevent additional parameters results in an git git error
    process.argv = process.argv.slice(0, 3);
    if (!(await git_1.isGitRepo(options.repoPath))) {
        await git_1.gitInit();
    }
    try {
        const hadCommited = await commit_1.default(options);
        if (hadCommited) {
            console.log('Selected files committed\n');
        }
        // bump version
        await version_1.default.bump();
        // push
        const unPushed = await git_1.getUnpushedCommits();
        if (unPushed) {
            console.log();
            console.log(`Unpushed commits(${unPushed.split('\n').filter((u) => u).length}):`);
            console.log(unPushed);
            const answer = await inquirer_1.default.prompt({
                type: 'confirm',
                name: 'pushCommits',
                message: 'Do you want to push now?',
                default: false
            });
            if (answer.pushCommits) {
                await git_1.push();
                await git_1.push('--tags');
                console.log('All commits and tags pushed\n');
            }
        }
        // publish
        if (await pkg_1.pkgExist()) {
            const pkg = pkg_1.readPkg();
            if (!pkg.private) {
                await publish_1.default(pkg);
            }
        }
        // status
        await git_1.getStatus();
        const unPushed2 = await git_1.getUnpushedCommits();
        if (unPushed2) {
            console.log(` (${unPushed2.split('\n').filter((u) => u).length} commits unpushed)`);
        }
        console.log();
    }
    catch (err) {
        console.log(err);
        console.error(err);
        process.exit(0);
    }
}
exports.default = entry;

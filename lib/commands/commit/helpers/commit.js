"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const execa_1 = tslib_1.__importDefault(require("execa"));
const inquirer = require('inquirer');
const { bootstrap } = require('@peak-stone/commitizen-promise/dist/cli/git-cz');
const { getStatus, getStaged, getUnpushedCommits } = require('./git');
function czCommit() {
    return bootstrap({
        cliPath: '@peak-stone/commitizen-promise',
        config: {
            path: '@peak-stone/cz-fbi'
        }
    });
}
async function commit(options) {
    try {
        const needAdd = await getStatus();
        const unPushed = await getUnpushedCommits();
        if (unPushed) {
            console.log(` (${unPushed.split('\n').filter((u) => u).length} commits unpushed)`);
        }
        console.log();
        if (Array.isArray(needAdd)) {
            // select files to add
            const answer = await inquirer.prompt({
                type: 'checkbox',
                name: 'files',
                message: 'select files staged for commit:',
                choices: needAdd.map((n) => {
                    return { name: n };
                }),
                pageSize: 20
            });
            if (answer && answer.files && answer.files.length > 0) {
                // add files
                const filesToAdd = answer.files.length === needAdd.length ? '.' : answer.files.join(' ');
                await execa_1.default.command(`git add ${filesToAdd}`, {
                    cwd: options.repoPath,
                    shell: true
                });
                await czCommit();
                return true;
            }
        }
        const hasStaged = await getStaged();
        if (hasStaged) {
            await czCommit();
            return true;
        }
        else {
            console.log('Nothing to commit');
        }
    }
    catch (err) {
        throw err;
    }
}
exports.default = commit;
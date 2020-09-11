"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitInit = exports.isClean = exports.push = exports.getUnpushedCommits = exports.getStaged = exports.getStatus = exports.showStatus = exports.isGitRepo = void 0;
const tslib_1 = require("tslib");
const execa = tslib_1.__importStar(require("execa"));
const inquirer = tslib_1.__importStar(require("inquirer"));
const getStream = require("get-stream");
const isWin = process.platform === 'win32';
const root = process.cwd();
async function isGitRepo(dir = process.cwd()) {
    try {
        const ret = await execa.command('git rev-parse --git-dir', {
            cwd: dir,
            shell: true
        });
        return !!ret;
    }
    catch (err) {
        return false;
    }
}
exports.isGitRepo = isGitRepo;
function showStatus(filepath = '') {
    return execa.command(`git status --short ${filepath || ''}`, {
        cwd: root,
        stdio: 'inherit',
        shell: true
    });
}
exports.showStatus = showStatus;
async function getStatus(filepath = '', nolog = false) {
    const cmd = isWin
        ? `git status ${filepath || ''} --porcelain`
        : `git status ${filepath || ''} --porcelain | sed s/^...//`;
    const stream = execa.command(cmd, {
        cwd: root,
        shell: true
    }).stdout;
    if (!stream) {
        return '';
    }
    const stdout = await getStream(stream);
    let ret = stdout;
    if (ret.trim() && !nolog) {
        ret = ret.split('\n').filter((p) => p.trim());
        if (isWin) {
            ret = ret.map((i) => i.slice(3));
        }
        console.log();
        console.log('current status:');
        await showStatus();
        return ret;
    }
    return ret.trim();
}
exports.getStatus = getStatus;
// show only staged files
async function getStaged() {
    // git diff --staged
    // git diff --cached --name-only
    // git diff --name-only --cached | xargs
    const stream = execa.command('git diff --name-only --cached', {
        cwd: root,
        shell: true
    }).stdout;
    if (!stream) {
        return '';
    }
    let stdout = await getStream(stream);
    stdout = stdout.trim();
    if (stdout) {
        console.log('files to commit:');
        console.log(stdout);
        console.log();
    }
    return stdout;
}
exports.getStaged = getStaged;
// This will list out your local comment history (not yet pushed) with corresponding message
// git reflog
async function getUnpushedCommits() {
    const stream = execa.command('git cherry -v', {
        cwd: root,
        shell: true
    }).stdout;
    if (!stream) {
        return '';
    }
    return getStream(stream);
}
exports.getUnpushedCommits = getUnpushedCommits;
async function push(args = '') {
    return execa.command(`git push ${args || ''}`, {
        cwd: root,
        stdio: 'inherit',
        shell: true
    });
}
exports.push = push;
function isClean() {
    return getStatus('', true);
}
exports.isClean = isClean;
async function gitInit() {
    const answer = await inquirer.prompt({
        type: 'confirm',
        name: 'initNow',
        message: 'This is not a git repository. "git init" now?',
        default: false
    });
    if (answer && answer.initNow) {
        return execa.command('git init', {
            cwd: root,
            shell: true
        });
    }
    else {
        process.exit(0);
    }
}
exports.gitInit = gitInit;

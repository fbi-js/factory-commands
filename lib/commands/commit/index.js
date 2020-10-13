"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = require("path");
const fbi_1 = require("fbi");
const standard_version_1 = tslib_1.__importDefault(require("standard-version"));
const commit_json_1 = tslib_1.__importDefault(require("./configs/commit.json"));
const release_json_1 = tslib_1.__importDefault(require("./configs/release.json"));
const { git, isGitRepo, merge, isValidArray, isObject, isWindows } = fbi_1.utils;
const bump = require('standard-version/lib/lifecycles/bump');
const changelog = require('standard-version/lib/lifecycles/changelog');
const commit = require('standard-version/lib/lifecycles/commit');
const tag = require('standard-version/lib/lifecycles/tag');
const defaults = {
    repoPath: process.cwd()
};
class CommandCommit extends fbi_1.Command {
    constructor(factory) {
        super();
        this.factory = factory;
        this.id = 'commit';
        this.alias = 'c';
        this.description = 'git commit and version release toolkit';
        this.args = '';
        this.flags = [];
        this.configs = {
            commit: {
                types: [],
                scopes: []
            },
            release: {}
        };
    }
    async run(args, flags) {
        this.debug(`Factory: (${this.factory.id})`, 'from command', `"${this.id}"`);
        this.getConfigs();
        const options = defaults;
        const pkg = await this.getPkg();
        // prevent additional parameters results in an git error
        process.argv = process.argv.slice(0, 3);
        if (!(await isGitRepo(options.repoPath))) {
            await this.gitInit();
        }
        const hadCommited = await this.commit(options);
        if (hadCommited) {
            console.log('Selected files committed\n');
        }
        const { prerelease } = await this.bumpVersion(pkg);
        // push
        const unPushed = await git.status.unpushed();
        if (unPushed.length > 0) {
            console.log();
            console.log(`Unpushed commits(${unPushed.length}):`);
            console.log(unPushed.join('\n'));
            const answer = (await this.prompt({
                type: 'confirm',
                name: 'pushCommits',
                message: 'Do you want to push now?',
                initial: false
            }));
            if (answer.pushCommits) {
                await git.push();
                await git.push('--tags');
                console.log('All commits and tags pushed\n');
            }
        }
        // publish
        if (pkg && !pkg.private) {
            await this.publish(pkg, prerelease);
        }
        // status
        await git.status.changes();
        const unPushed2 = await git.status.unpushed();
        if (unPushed2) {
            console.log(` (${unPushed2.length} commits unpushed)`);
        }
        console.log();
    }
    getConfigs() {
        const { commit, release } = this.context.get('config');
        // validate
        if (commit && !isObject(commit)) {
            this.error('config "commit" should be a json object').exit();
        }
        if (release && !isObject(release)) {
            this.error('config "release" should be a json object').exit();
        }
        this.configs = {
            commit: merge(commit_json_1.default, commit || { types: [], scopes: [] }),
            release: merge(release_json_1.default, release || {})
        };
    }
    async gitInit() {
        const answer = (await this.prompt({
            type: 'confirm',
            name: 'initNow',
            message: 'This is not a git repository. "git init" now?',
            initial: false
        }));
        if (answer && answer.initNow) {
            return git.init();
        }
        else {
            process.exit(0);
        }
    }
    async commit(options) {
        var _a;
        try {
            const needAdd = await git.status.changes();
            const unPushed = await git.status.unpushed();
            if (unPushed) {
                console.log(this.style.yellow `${unPushed.length} commits unpushed`);
            }
            if (needAdd.length > 0) {
                // select files to add
                const answer = (await this.prompt({
                    type: 'multiselect',
                    name: 'files',
                    message: 'select files staged for commit:',
                    choices: needAdd.map((n) => ({ name: n })),
                    pageSize: 20
                }));
                if (((_a = answer === null || answer === void 0 ? void 0 : answer.files) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                    // add files
                    const fileNames = answer.files.map((file) => {
                        const [status, path] = file.split(' ');
                        return path;
                    });
                    await git.add(fileNames);
                    const message = await this.promptCommit();
                    await git.commit(message);
                    return true;
                }
            }
            const hasStaged = await git.status.staged();
            if (hasStaged.length > 0) {
                const message = await this.promptCommit();
                await git.commit(message);
                return true;
            }
            else {
                console.log(this.style.cyan `nothing to commit, working tree clean`);
            }
        }
        catch (err) {
            throw err;
        }
    }
    async bumpVersion(pkg) {
        const answerBump = (await this.prompt({
            type: 'confirm',
            name: 'bumpVersion',
            message: 'Bump the package version?',
            initial: false
        }));
        if (!(answerBump === null || answerBump === void 0 ? void 0 : answerBump.bumpVersion)) {
            return { prerelease: false };
        }
        const oldVersion = (pkg && pkg.version) || (await git.tag.latest());
        if (!oldVersion) {
            await standard_version_1.default({ ...release_json_1.default, firstRelease: true });
            console.log(`current version is ${oldVersion}`);
            this.log(`new version: ${this.style.bold(await git.tag.latest())}`);
            return { prerelease: false };
        }
        this.log(`current version is ${this.style.bold(oldVersion)}`);
        // select bump type
        let tagNames = ['alpha', 'beta', 'rc', ''];
        const prerelease = tagNames.filter((t) => !!t).find((t) => oldVersion.includes(t));
        if (prerelease) {
            const idx = tagNames.findIndex((t) => t === prerelease);
            tagNames = tagNames.slice(idx + 1);
        }
        else {
            tagNames = ['alpha', ''];
        }
        let releaseTypes = prerelease ? ['patch'] : ['patch', 'minor', 'major'];
        const opts = {
            ...release_json_1.default,
            dryRun: true
        };
        const recommendedVersion = await bump({ ...opts, ...(prerelease ? { prerelease } : {}) }, oldVersion);
        const bumps = [];
        for (const tag of tagNames) {
            for (const type of releaseTypes) {
                bumps.push(await bump(tag
                    ? {
                        ...opts,
                        releaseAs: type,
                        prerelease: tag
                    }
                    : {
                        ...opts,
                        releaseAs: type
                    }, oldVersion).then((newVersion) => ({
                    name: `${type} ${tag}`,
                    message: newVersion,
                    hint: `${type} ${tag}`
                })));
            }
        }
        const choices = [
            {
                name: ` ${prerelease || ''}`,
                message: recommendedVersion,
                hint: 'recommended'
            },
            ...bumps
        ];
        const anwser = (await this.prompt({
            type: 'select',
            name: 'version',
            message: 'How would you like to bump it?',
            choices,
            pageSize: 20
        }));
        const results = anwser.version.split(' ');
        const options = {
            ...release_json_1.default,
            ...(results[0] ? { releaseAs: results[0] } : {}),
            ...(results[1] ? { prerelease: results[1] } : {})
        };
        const newVersion = await bump(options, oldVersion);
        await changelog(options, newVersion);
        await commit(options, newVersion);
        await tag(newVersion, pkg ? pkg.private : false, options);
        this.log(`new version: ${this.style.bold(newVersion)}`);
        return {
            prerelease,
            newVersion
        };
    }
    async publish(pkg, prerelease) {
        if (!pkg || !pkg.name) {
            console.error('Invalid package.json');
            process.exit();
        }
        const answer = (await this.prompt({
            type: 'confirm',
            name: 'npmPublish',
            message: 'Publish to npmjs.com ?'
        }));
        if (!answer || !answer.npmPublish) {
            return;
        }
        let cmd = 'npm publish';
        const response = (await this.prompt({
            type: 'input',
            name: 'npmTag',
            message: 'Input the npm tag',
            initial: prerelease ? 'next' : 'latest'
        }));
        if (response === null || response === void 0 ? void 0 : response.npmTag) {
            cmd += ` --tag ${response.npmTag}`;
        }
        if (pkg.name.startsWith('@')) {
            const answerPub = (await this.prompt({
                type: 'confirm',
                name: 'public',
                message: 'This is a scoped package, publish as public ?',
                initial: true
            }));
            if (answerPub && answerPub.public) {
                cmd += ' --access=public';
            }
        }
        await this.exec.command(cmd, {
            cwd: process.cwd(),
            shell: true
        });
        console.log('Publish successfully\n');
    }
    async getPkg() {
        const pkgPath = path_1.join(process.cwd(), 'package.json');
        if (await this.fs.pathExists(pkgPath)) {
            return require(pkgPath);
        }
        return null;
    }
    async promptCommit() {
        const { commit } = this.configs;
        const questions = [
            {
                type: 'select',
                name: 'type',
                message: 'type of change      (required):',
                choices: this.typeChoices(commit.types)
            },
            isValidArray(commit.scopes)
                ? {
                    type: 'select',
                    name: 'scope',
                    message: 'affected scope      (required):',
                    choices: commit.scopes.map((name) => ({
                        name
                    }))
                }
                : {
                    type: 'input',
                    name: 'scope',
                    message: 'affected scope      (optional):'
                },
            {
                type: 'input',
                name: 'subject',
                message: 'short description   (required):',
                validate(answer) {
                    return !answer.trim() ? 'Please write a short description' : true;
                }
            },
            {
                type: 'input',
                name: 'body',
                message: 'longer description  (optional):'
                // \n - first \n - second \n - third
            },
            {
                type: 'input',
                name: 'issues',
                message: 'issue closed        (optional):'
            },
            {
                type: 'input',
                name: 'breaking',
                message: 'breaking change     (optional):'
            }
        ];
        const answer = (await this.prompt(questions));
        // format
        const scope = answer.scope ? '(' + answer.scope.trim() + ')' : '';
        const subject = answer.subject.trim();
        const body = answer.body.trim();
        const issues = answer.issues.trim();
        let breaking = answer.breaking.trim();
        let messages = [];
        messages.push(answer.type + scope + ': ' + subject);
        if (body) {
            messages = messages.concat(body.split(';'));
        }
        if (issues) {
            const issuesIds = issues.match(/#\d+/g);
            if (issuesIds) {
                messages.push(issuesIds.map((id) => `fixed ${id}`).join(', '));
            }
        }
        breaking = breaking ? 'BREAKING CHANGE: ' + breaking.replace(/^BREAKING CHANGE: /, '') : '';
        if (breaking) {
            messages = messages.concat(breaking.split(';'));
        }
        return messages.map((msg) => msg.trim()).filter(Boolean);
    }
    typeChoices(types) {
        const maxNameLength = types.reduce((maxLength, type) => (type.name.length > maxLength ? type.name.length : maxLength), 0);
        return types.map((choice) => ({
            name: choice.name,
            message: `${choice.name.padEnd(maxNameLength, ' ')}  ${isWindows ? ':' : choice.emoji || ':'}  ${choice.description}`
        }));
    }
}
exports.default = CommandCommit;

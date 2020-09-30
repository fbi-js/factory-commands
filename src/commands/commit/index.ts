import { join } from 'path'
import { Command, utils } from 'fbi'
import standardVersion from 'standard-version'

import Factory from '../..'
import configCommit from './configs/commit.json'
import configRelease from './configs/release.json'

const { git, isGitRepo, merge, isValidArray, isObject, isWindows } = utils

const bump = require('standard-version/lib/lifecycles/bump')
const changelog = require('standard-version/lib/lifecycles/changelog')
const commit = require('standard-version/lib/lifecycles/commit')
const tag = require('standard-version/lib/lifecycles/tag')

const defaults = {
  repoPath: process.cwd()
}

export default class CommandCommit extends Command {
  id = 'commit'
  alias = 'c'
  description = 'git commit and version release toolkit'
  args = ''
  flags = []
  configs = {
    commit: {
      types: [],
      scopes: []
    },
    release: {}
  }

  constructor(public factory: Factory) {
    super()
  }

  async run(args: any, flags: any) {
    this.debug(`Factory: (${this.factory.id})`, 'from command', `"${this.id}"`)

    this.getConfigs()
    const options = defaults
    const pkg = await this.getPkg()

    // prevent additional parameters results in an git error
    process.argv = process.argv.slice(0, 3)
    if (!(await isGitRepo(options.repoPath))) {
      await this.gitInit()
    }

    const hadCommited = await this.commit(options)
    if (hadCommited) {
      console.log('Selected files committed\n')
    }

    const { prerelease } = await this.bumpVersion(pkg)

    // push
    const unPushed = await git.status.unpushed()
    if (unPushed.length > 0) {
      console.log()
      console.log(`Unpushed commits(${unPushed.length}):`)
      console.log(unPushed.join('\n'))

      const answer = (await this.prompt({
        type: 'confirm',
        name: 'pushCommits',
        message: 'Do you want to push now?',
        initial: false
      })) as any

      if (answer.pushCommits) {
        await git.push()
        await git.push('--tags')
        console.log('All commits and tags pushed\n')
      }
    }

    // publish
    if (pkg && !pkg.private) {
      await this.publish(pkg, prerelease)
    }

    // status
    await git.status.changes()
    const unPushed2 = await git.status.unpushed()
    if (unPushed2) {
      console.log(` (${unPushed2.length} commits unpushed)`)
    }
    console.log()
  }

  private getConfigs() {
    const { commit, release } = this.context.get('config')
    // validate
    if (commit && !isObject(commit)) {
      this.error('config "commit" should be a json object').exit()
    }
    if (release && !isObject(release)) {
      this.error('config "release" should be a json object').exit()
    }

    this.configs = {
      commit: merge(configCommit, commit || { types: [], scopes: [] }) as any,
      release: merge(configRelease, release || {})
    }
  }

  private async gitInit() {
    const answer = (await this.prompt({
      type: 'confirm',
      name: 'initNow',
      message: 'This is not a git repository. "git init" now?',
      initial: false
    })) as any

    if (answer && answer.initNow) {
      return this.exec.command('git init', {
        cwd: process.cwd(),
        shell: true
      })
    } else {
      process.exit(0)
    }
  }

  private async commit(options: any) {
    try {
      const needAdd = await git.status.changes()
      const unPushed = await git.status.unpushed()
      if (unPushed) {
        console.log(this.style.yellow`${unPushed.length} commits unpushed`)
      }

      if (needAdd.length > 0) {
        // select files to add
        const answer = (await this.prompt({
          type: 'multiselect',
          name: 'files',
          message: 'select files staged for commit:',
          choices: needAdd.map((n: string) => ({ name: n })),
          pageSize: 20
        } as any)) as any

        if (answer && answer.files && answer.files.length > 0) {
          // add files
          const filesToAdd = answer.files.length === needAdd.length ? '.' : answer.files.join(' ')

          await this.exec.command(`git add ${filesToAdd}`, {
            cwd: options.repoPath,
            shell: true
          })

          const message = await this.promptCommit()
          await git.commit(message)
          return true
        }
      }

      const hasStaged = await git.status.staged()
      if (hasStaged.length > 0) {
        const message = await this.promptCommit()
        await git.commit(message)
        return true
      } else {
        console.log(this.style.cyan`nothing to commit, working tree clean`)
      }
    } catch (err) {
      throw err
    }
  }

  private async bumpVersion(pkg: any) {
    const answerBump = (await this.prompt({
      type: 'confirm',
      name: 'bumpVersion',
      message: 'Bump the package version?',
      initial: false
    })) as any

    if (!answerBump?.bumpVersion) {
      return { prerelease: false }
    }

    const oldVersion = (pkg && pkg.version) || (await git.tag.latest())
    if (!oldVersion) {
      await standardVersion({ ...configRelease, firstRelease: true })
      console.log(`current version is ${oldVersion}`)
      this.log(`new version: ${this.style.bold(await git.tag.latest())}`)
      return { prerelease: false }
    }
    this.log(`current version is ${this.style.bold(oldVersion)}`)

    // select bump type
    let tagNames = ['alpha', 'beta', 'rc', '']
    const prerelease = tagNames.filter((t) => !!t).find((t) => oldVersion.includes(t))
    if (prerelease) {
      const idx = tagNames.findIndex((t) => t === prerelease)
      tagNames = tagNames.slice(idx + 1)
    } else {
      tagNames = ['alpha', '']
    }
    let releaseTypes = prerelease ? ['patch'] : ['patch', 'minor', 'major']

    const opts = {
      ...configRelease,
      dryRun: true
    }

    const recommendedVersion = await bump(
      { ...opts, ...(prerelease ? { prerelease } : {}) },
      oldVersion
    )

    const bumps = []
    for (const tag of tagNames) {
      for (const type of releaseTypes) {
        bumps.push(
          await bump(
            tag
              ? {
                  ...opts,
                  releaseAs: type,
                  prerelease: tag
                }
              : {
                  ...opts,
                  releaseAs: type
                },
            oldVersion
          ).then((newVersion: string) => ({
            name: `${type} ${tag}`,
            message: newVersion,
            hint: `${type} ${tag}`
          }))
        )
      }
    }

    const choices = [
      {
        name: ` ${prerelease || ''}`,
        message: recommendedVersion,
        hint: 'recommended'
      },
      ...bumps
    ]

    const anwser = (await this.prompt({
      type: 'select',
      name: 'version',
      message: 'How would you like to bump it?',
      choices,
      pageSize: 20
    } as any)) as any

    const results = anwser.version.split(' ')
    const options = {
      ...configRelease,
      ...(results[0] ? { releaseAs: results[0] } : {}),
      ...(results[1] ? { prerelease: results[1] } : {})
    }
    const newVersion = await bump(options, oldVersion)
    await changelog(options, newVersion)
    await commit(options, newVersion)
    await tag(newVersion, pkg ? pkg.private : false, options)

    this.log(`new version: ${this.style.bold(newVersion)}`)

    return {
      prerelease,
      newVersion
    }
  }

  private async publish(pkg: any, prerelease?: any) {
    if (!pkg || !pkg.name) {
      console.error('Invalid package.json')
      process.exit()
    }

    const answer = (await this.prompt({
      type: 'confirm',
      name: 'npmPublish',
      message: 'Publish to npmjs.com ?'
    })) as any

    if (!answer || !answer.npmPublish) {
      return
    }

    let cmd = 'npm publish'
    const response = (await this.prompt({
      type: 'input',
      name: 'npmTag',
      message: 'Input the npm tag',
      initial: prerelease ? 'next' : 'latest'
    })) as any
    if (response?.npmTag) {
      cmd += ` --tag ${response.npmTag}`
    }

    if (pkg.name.startsWith('@')) {
      const answerPub = (await this.prompt({
        type: 'confirm',
        name: 'public',
        message: 'This is a scoped package, publish as public ?',
        initial: true
      })) as any

      if (answerPub && answerPub.public) {
        cmd += ' --access=public'
      }
    }

    await this.exec.command(cmd, {
      cwd: process.cwd(),
      shell: true
    })
    console.log('Publish successfully\n')
  }

  private async getPkg() {
    const pkgPath = join(process.cwd(), 'package.json')
    if (await this.fs.pathExists(pkgPath)) {
      return require(pkgPath)
    }
    return null
  }

  private async promptCommit() {
    const { commit } = this.configs
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
            choices: commit.scopes.map((name: string) => ({
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
        validate(answer: any) {
          return !answer.trim() ? 'Please write a short description' : true
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
    ]

    const answer = (await this.prompt(questions)) as any

    // format
    const scope = answer.scope ? '(' + answer.scope.trim() + ')' : ''
    const subject = answer.subject.trim()
    const body = answer.body.trim()
    const issues = answer.issues.trim()
    let breaking = answer.breaking.trim()

    let messages = []

    messages.push(answer.type + scope + ': ' + subject)
    if (body) {
      messages = messages.concat(body.split(';'))
    }
    if (issues) {
      const issuesIds = issues.match(/#\d+/g)
      if (issuesIds) {
        messages.push(issuesIds.map((id: string) => `fixed ${id}`).join(', '))
      }
    }

    breaking = breaking ? 'BREAKING CHANGE: ' + breaking.replace(/^BREAKING CHANGE: /, '') : ''
    if (breaking) {
      messages = messages.concat(breaking.split(';'))
    }

    return messages.map((msg: string) => msg.trim()).filter(Boolean)
  }

  private typeChoices(types: any[]) {
    const maxNameLength = types.reduce(
      (maxLength, type) => (type.name.length > maxLength ? type.name.length : maxLength),
      0
    )

    return types.map((choice) => ({
      name: choice.name,
      message: `${choice.name.padEnd(maxNameLength, ' ')}  ${
        isWindows ? ':' : choice.emoji || ':'
      }  ${choice.description}`
    }))
  }
}

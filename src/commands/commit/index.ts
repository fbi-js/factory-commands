import { join } from 'path'
import { Command, utils } from 'fbi'
import standardVersion from 'standard-version'

import Factory from '../..'
import configStandardVersion from './configs/standard-version.json'

const { bootstrap } = require('@peak-stone/commitizen-promise/dist/cli/git-cz')
const bump = require('standard-version/lib/lifecycles/bump')
const changelog = require('standard-version/lib/lifecycles/changelog')
const commit = require('standard-version/lib/lifecycles/commit')
const tag = require('standard-version/lib/lifecycles/tag')

const defaults = {
  repoPath: process.cwd()
}
function czCommit() {
  return bootstrap({
    cliPath: '@peak-stone/commitizen-promise',
    config: {
      path: '@peak-stone/cz-fbi'
    }
  })
}

export default class CommandCommit extends Command {
  id = 'commit'
  alias = 'c'
  description = 'git commit and version release toolkit'
  args = ''
  flags = []

  constructor(public factory: Factory) {
    super()
  }

  async run(args: any, flags: any) {
    this.debug(`Factory: (${this.factory.id})`, 'from command', `"${this.id}"`)

    const options = defaults
    const pkg = await this.getPkg()

    // prevent additional parameters results in an git error
    process.argv = process.argv.slice(0, 3)
    if (!(await utils.isGitRepo(options.repoPath))) {
      await this.gitInit()
    }

    const hadCommited = await this.commit(options)
    if (hadCommited) {
      console.log('Selected files committed\n')
    }

    const { prerelease } = await this.bumpVersion(pkg)

    // push
    const unPushed = await utils.git.status.unpushed()
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
        await utils.git.push()
        await utils.git.push('--tags')
        console.log('All commits and tags pushed\n')
      }
    }

    // publish
    if (pkg && !pkg.private) {
      await this.publish(pkg, prerelease)
    }

    // status
    await utils.git.status.changes()
    const unPushed2 = await utils.git.status.unpushed()
    if (unPushed2) {
      console.log(` (${unPushed2.length} commits unpushed)`)
    }
    console.log()
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
      const needAdd = await utils.git.status.changes()
      const unPushed = await utils.git.status.unpushed()
      if (unPushed) {
        console.log(` (${unPushed.length} commits unpushed)`)
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

          await czCommit()
          return true
        }
      }

      const hasStaged = await utils.git.status.staged()
      if (hasStaged.length > 0) {
        await czCommit()
        return true
      } else {
        console.log('nothing to commit')
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

    const oldVersion = await utils.git.tag.latest()
    if (!oldVersion) {
      await standardVersion({ ...configStandardVersion, firstRelease: true })
      console.log(`current version is ${oldVersion}`)
      this.log(`new version: ${this.style.bold(await utils.git.tag.latest())}`)
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
      ...configStandardVersion,
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
      ...configStandardVersion,
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
}

import inquirer from 'inquirer'
import version from './helpers/version'
import commit from './helpers/commit'
import publish from './helpers/publish'
import { isGitRepo, getStatus, getUnpushedCommits, push, gitInit } from './helpers/git'
import { pkgExist, readPkg } from './helpers/pkg'

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at: Promise ', promise, ' reason: ', reason)
  throw reason
})

process.on('uncaughtException', async (error) => {
  console.error(error)
  process.exit(0)
})

const defaults = {
  repoPath: process.cwd()
}

export default async function entry(options = defaults) {
  // prevent additional parameters results in an git git error
  process.argv = process.argv.slice(0, 3)
  if (!(await isGitRepo(options.repoPath))) {
    await gitInit()
  }

  try {
    const hadCommited = await commit(options)
    if (hadCommited) {
      console.log('Selected files committed\n')
    }

    // bump version
    await version.bump()

    // push
    const unPushed = await getUnpushedCommits()
    if (unPushed) {
      console.log()
      console.log(`Unpushed commits(${unPushed.split('\n').filter((u:any) => u).length}):`)
      console.log(unPushed)

      const answer = await inquirer.prompt({
        type: 'confirm',
        name: 'pushCommits',
        message: 'Do you want to push now?',
        default: false
      })

      if (answer.pushCommits) {
        await push()
        await push('--tags')
        console.log('All commits and tags pushed\n')
      }
    }

    // publish
    if (await pkgExist()) {
      const pkg = readPkg()
      if (!pkg.private) {
        await publish(pkg)
      }
    }

    // status
    await getStatus()
    const unPushed2 = await getUnpushedCommits()
    if (unPushed2) {
      console.log(` (${unPushed2.split('\n').filter((u: any) => u).length} commits unpushed)`)
    }
    console.log()
  } catch (err) {
    console.log(err)
    console.error(err)
    process.exit(0)
  }
}

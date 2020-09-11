import * as path from 'path'
import * as inquirer from 'inquirer'
import standardVersion from 'standard-version'
import { pkgExist } from './pkg'
import configStandardVersion from '../configs/standard-version.json'

async function bumpVersion() {
  try {
    await standardVersion(configStandardVersion)
  } catch (err) {
    console.error(`standard-version failed with message: ${err.message}`)
  }
}

async function bump() {
  if (await pkgExist()) {
    const answerBump = await inquirer.prompt({
      type: 'confirm',
      name: 'bumpVersion',
      message: 'Bump the package version?',
      default: false
    })

    if (answerBump && answerBump.bumpVersion) {
      await bumpVersion()
    }
  }
}

export default {
  bump
}

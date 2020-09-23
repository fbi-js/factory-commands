import { join } from 'path'
import { Factory } from 'fbi'

import CommandCommit from './commands/commit'
import CommandLint from './commands/lint'

export default class FactoryTaskCommit extends Factory {
  id = 'factory-commands'
  description = 'global commands for fbi'
  commands = [new CommandCommit(this), new CommandLint(this)]
  templates = []
  isGlobal = true

  execOpts = {
    cwd: process.cwd(),
    localDir: join(__dirname, '../'),
    preferLocal: true
  }
}

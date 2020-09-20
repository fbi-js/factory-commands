import { join } from 'path'
import { Factory } from 'fbi'
import CommandCommit from './commands/commit/'
import CommandDemo from './commands/demo/'

export default class FactoryTaskCommit extends Factory {
  id = 'factory-commands'
  description = 'global commands for fbi'
  commands = [new CommandCommit(this), new CommandDemo(this)]
  templates = []
  isGlobal = true

  execOpts = {
    cwd: process.cwd(),
    localDir: join(__dirname, '../'),
    preferLocal: true
  }
}

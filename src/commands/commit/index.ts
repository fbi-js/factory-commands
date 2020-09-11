import { Command } from 'fbi'

import Factory from '../..'
import entry from './entry'

export default class CommandCommit extends Command {
  id = 'commit'
  alias = 'c'
  description = 'git commit and version release toolkit'
  args = ''
  flags = []

  constructor(factory: Factory) {
    super()
  }

  async run(flags: any) {
    console.log('----in command commit')
    await entry()
  }
}

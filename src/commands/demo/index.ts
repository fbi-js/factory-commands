import { Command } from 'fbi'

import Factory from '../..'

export default class CommandDemo extends Command {
  id = 'demo'
  alias = ''
  description = 'demo command'
  args = ''
  flags = []

  constructor(factory: Factory) {
    super()
  }

  async run(flags: any) {
    console.log('----in command demo')
  }
}

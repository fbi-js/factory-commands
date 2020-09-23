import { Command } from 'fbi'
import { join } from 'path'
import { ESLint } from 'eslint'

import Factory from '../..'
import defaults from './defaults.json'

export default class CommandDemo extends Command {
  id = 'lint'
  alias = ''
  description = 'code lint with eslint'
  args = ''
  flags = [['--fix', 'autofix', false]]

  constructor(public factory: Factory) {
    super()
  }

  async run(flags: any, unknow: any) {
    this.debug(`Factory: (${this.factory.id})`, 'from command', `"${this.id}" with options:`, {
      flags,
      unknow
    })

    const { fix } = flags
    const pkgDir = join(__dirname, '../../../node_modules/eslint-plugin-fbi')
    const configs = {
      ...defaults,
      resolvePluginsRelativeTo: pkgDir,
      fix
    }
    this.debug(JSON.stringify(configs, null, 2))
    const eslint = new ESLint(configs)
    const results = await eslint.lintFiles('./')
    const formatter = await eslint.loadFormatter('stylish')
    const messages = formatter.format(results)
    console.log(messages)
  }
}

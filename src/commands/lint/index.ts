import { Command } from 'fbi'
import { join } from 'path'
import { ESLint } from 'eslint'

import Factory from '../..'
import { getESLintConfig } from './utils'
import defaults from './defaults.json'

export default class CommandDemo extends Command {
  id = 'lint'
  alias = ''
  description = 'code lint with eslint'
  args = ''
  flags = [
    ['--cwd', 'process cwd', ''],
    ['--fix', 'autofix', false]
  ]

  constructor(public factory: Factory) {
    super()
  }

  async run(flags: any, unknow: any) {
    this.debug(`Factory: (${this.factory.id})`, 'from command', `"${this.id}" with options:`, {
      flags,
      unknow
    })

    const { cwd, fix } = flags
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

    // -----

    // const files = await this.glob('./**/*.*', {
    //   cwd: cwd || process.cwd()
    // })
    // this.debug(`files:\n${files.join('\n')}`)

    // let results: ESLint.LintResult[] = []
    // let messages = ''
    // console.log('__dirname:', __dirname)
    // for (const file of files) {
    //   const config = await getESLintConfig(file, this.factory)
    //   this.debug({ config })
    //   const code = await this.fs.readFile(file, 'utf8')
    //   const eslint = new ESLint({
    //     ...configs,
    //     resolvePluginsRelativeTo: pkgDir,
    //     fix
    //   })
    //   // const result: ESLint.LintResult[] = await eslint.lintFiles(file)
    //   const result: ESLint.LintResult[] = await eslint.lintText(code, {
    //     filePath: file
    //   })
    //   // console.log(result[0] && result[0].messages)
    //   results = result.concat(result)
    //   // 3. Format the results.
    //   const formatter = await eslint.loadFormatter('stylish')
    //   messages += formatter.format(results)
    // }
    // console.log(messages)
  }
}

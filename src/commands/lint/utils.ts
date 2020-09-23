import { ESLint } from 'eslint'
import { dirname } from 'path'

import Factory from '../..'

export async function getESLintConfig(filePath: string, factory: Factory) {
  const eslintOptions: ESLint.Options = {}
  if (filePath) {
    eslintOptions.cwd = dirname(filePath)
  }

  const eslint = new ESLint({})

  try {
    factory.debug(`getting eslint config for file at "${filePath}"`)
    const config = await eslint.calculateConfigForFile(filePath)
    return {
      ...eslintOptions,
      ...config
    }
  } catch (error) {
    // is this noisy? Try setting options.disableLog to false
    factory.debug('Unable to find config')
    return { overrideConfig: { rules: {} } }
  }
}

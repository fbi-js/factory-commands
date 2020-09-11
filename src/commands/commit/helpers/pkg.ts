const path = require('path')

const root = process.cwd()

async function pkgExist() {
  // return ctx.utils.fs.exist(path.join(root, 'package.json'))
  // TODO: do real logic
  return true
}

function readPkg() {
  return require(path.join(root, 'package.json'))
}

export { pkgExist, readPkg }

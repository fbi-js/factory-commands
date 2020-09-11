const { join } = require("path");
const { Factory } = require("fbi");
// @ts-ignore
const { version } = require("./package.json");
const CommandTaskCommit = require("./command/index");
class FactoryTaskCommit extends Factory {
  id = "fbi-task-commit";
  description = "factory for task commit";
  commands = [new CommandTaskCommit(this)];
  templates = [];

  execOpts = {
    cwd: process.cwd(),
    localDir: join(__dirname, "../"),
    preferLocal: true,
  };
}
module.exports = FactoryTaskCommit;

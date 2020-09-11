const { join } = require("path");
const { Command, utils } = require("fbi");
const Factory = require("../index");
const entry = require("./entry");
class CommandTaskCommit extends Command {
  id = "commit";
  alias = "c";
  description = "command commit description";
  args = "";
  flags = [];

  constructor(factory) {
    super();
  }

  async run(flags) {
    await entry();
  }
}

module.exports = CommandTaskCommit;

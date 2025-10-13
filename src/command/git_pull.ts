#!/usr/bin/env bun
import { Command } from "commander"
import { logcmd } from "../utils/command-log-format"
import { errParse } from "../utils/common-utils"
import { OraShow } from "../utils/ora-show"
import { exec } from "../utils/platform-utils"

new Command()
  .name("gpl")
  .description("git pull")
  .argument("[remote]", "remote name")
  .action(async (remote) => {
    const spinner = new OraShow("Pulling from git...")
    spinner.start()
    try {
      const result = await exec(`git pull ${remote ?? "origin"}`)
      spinner.stop()
      logcmd(result, "git-pull")
    } catch (error) {
      spinner.stop()
      throw error
    }
  })
  .parseAsync()
  .catch(errParse)

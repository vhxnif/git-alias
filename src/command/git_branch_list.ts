#!/usr/bin/env bun
import { Command } from "commander"
import { table } from "table"
import { branchList, type Branch } from "../action/branch-command"
import { color, tableTitle } from "../utils/color-utils"
import { default as page } from "../utils/page-prompt"
import { tableDataPartation, tableDefaultConfig } from "../utils/table-utils"
import { errParse, isEmpty } from "../utils/common-utils"

function trackParse(track: string) {
  // ↑ ↓
  const { green, blue, yellow } = color
  const fmt = (a: string, b: string) =>
    `${yellow("↑")}·${green(a)} ${yellow("↓")}·${blue(b)}`
  const str = track.substring(1, track.length - 2)
  if (str.indexOf(",") !== -1) {
    // [ahead 10, behind 5]
    const [, a, , b] = str
      .split(",")
      .flatMap((it) => it.split(" "))
      .map((it) => it.trim())
    return fmt(a, b)
  }
  // [ahead 3] or [behind 5]
  const [type, num] = str.split(" ")
  if (type === "ahead") {
    return fmt(num, "0")
  }
  if (type === "behind") {
    return fmt("0", num)
  }
  return str
}

function branchParse(bs: Branch[]): string[][] {
  return bs.map((it) => {
    const { isCurrent, name, upstream, track } = it

    return [
      `${isCurrent ? color.yellow(name) : color.blue(name)}${isEmpty(upstream) ? "" : `\n${color.green(upstream)}`}`,
      isEmpty(track) ? "" : `\n${trackParse(track)}`,
    ]
  })
}

function tableParse(arr: string[][][]) {
  return arr.map((it) => {
    return table(
      [tableTitle(["Branch\nUpstream", "Track"]), ...it],
      tableDefaultConfig,
    )
  })
}

new Command()
  .name("gbl")
  .description("git branch -l / git branch -a")
  .argument("[name]", "barnch name", "")
  .option("-a, --all", "list all", false)
  .action(async (name, { all }) => {
    const data = await branchList({
      name,
      all,
    })
      .then(branchParse)
      .then(tableDataPartation)
      .then(tableParse)

    await page({ data })
  })
  .parseAsync()
  .catch(errParse)

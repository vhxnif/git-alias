import path from "path"
import { select } from "@inquirer/prompts"
import { configPath, exec } from "../utils/platform-utils"
import type { Choice } from "../utils/inquirer-utils"
import { isEmpty } from "../utils/common-utils"
import Database from "bun:sqlite"
import { BranchHistoryStore } from "../store/branch-history-store"

// ---- branch action history ---- //
async function branchHisDataPath() {
  const res = await exec("git rev-parse --is-inside-work-tree")
  if (res !== "true") {
    throw new Error("Current Dir is Not a Git Dir")
  }
  const dir = (await exec("git rev-parse --absolute-git-dir")).trim()
  return `${configPath()}${path.sep}branch_his_${dir
    .replaceAll(/(\.|:)/g, "")
    .replaceAll(/(\\|\/)/g, "_")}.sqlite`
}

async function branchHistory(): Promise<BranchHistoryStore> {
  const path = await branchHisDataPath()
  return new BranchHistoryStore(new Database(path))
}

// ---- git branch ---- //
type Branch = {
  name: string
  isCurrent: boolean
  upstream: string
  track: string
}
type BranchListArg = {
  all?: boolean
  name?: string
}

async function branchList({ name, all }: BranchListArg): Promise<Branch[]> {
  const baseCmd =
    'git branch -vv --format "%(HEAD)│%(refname:short)│%(upstream:short)│%(upstream:track)"'
  const localBranchList = () => `${baseCmd} -l ${name ? `'*${name}*'` : ""}`
  let cmd = localBranchList()
  if (all) {
    cmd = `${baseCmd} -a`
  }
  const execText = await exec(cmd)
  if (!execText) {
    throw Error("No Branch Matched.")
  }
  const matched = execText
    .split("\n")
    .filter((it) => (name ? it.includes(name) : it))
  if (isEmpty(matched)) {
    throw Error("No Branch Matched.")
  }
  return matched
    .map((it) => it.split("│"))
    .map(
      (it) =>
        ({
          isCurrent: it[0] === "*",
          name: it[1],
          upstream: it[2],
          track: it[3],
        }) as Branch,
    )
}

// ---- git switch ---- //
type GitSwitchArg = {
  branch: Branch
  args?: string[]
}

async function gitSwitch({ branch, args }: GitSwitchArg): Promise<string> {
  return await exec(`git switch ${args ? args.join(" ") : ""} ${branch.name}`)
}

// ---- git branch -D ---- //
async function gitBranchDelte({ name }: Branch): Promise<string> {
  return await exec(`git branch -D ${name}`)
}

// ---- git merge <branch> ---- //
async function gitBranchMerge({ name }: Branch): Promise<string> {
  return await exec(`git merge ${name}`)
}

// ---- git rebase <branch> ---- //
async function gitBranchRebase({ name }: Branch): Promise<string> {
  return await exec(`git rebase ${name}`)
}

// ---- interation ---- //
type BranchActionArg = BranchListArg & {
  command: (branch: Branch) => Promise<void>
  branchSort?: (branch: Branch[]) => Branch[]
  branchFilter?: (branch: Branch) => boolean
}

function branchChoices(branchs: Branch[]): Choice<Branch>[] {
  if (isEmpty(branchs)) {
    throw Error("Branch Missing.")
  }
  return branchs.map((it) => ({
    name: it.name,
    value: it,
  }))
}

async function branchAction({
  all,
  name,
  command,
  branchFilter,
  branchSort,
}: BranchActionArg): Promise<void> {
  const branchs = await branchList({ all, name })
    .then((it) => (branchSort ? branchSort(it) : it))
    .then((it) => (branchFilter ? it.filter(branchFilter) : it))
  const choices = branchChoices(branchs)
  await select({
    message: "Select Branch:",
    choices,
  }).then(async (it) => await command(it))
}

export {
  type Branch,
  type GitSwitchArg,
  branchHistory,
  branchList,
  branchAction,
  gitSwitch,
  gitBranchDelte,
  gitBranchMerge,
  gitBranchRebase,
}

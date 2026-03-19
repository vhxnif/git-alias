#!/usr/bin/env bun
import { Command } from 'commander'
import { color, tableTitle } from '../utils/color-utils'
import { printTable, tableConfig } from '../utils/table-utils'

const key = color.yellow
const val = color.sky
const desc = color.overlay0

type CmdEntry = [string, string, string]

const cmd = (alias: string, command: string, description: string): CmdEntry => [
    key(alias),
    val(command),
    desc(description),
]

const section = (title: string): CmdEntry => [
    color.green.bold(`▼ ${title}`),
    '',
    '',
]

const makeTableData = (): (CmdEntry | string[])[] => [
    tableTitle(['Alias', 'Command', 'Description']),
    section('Basic'),
    cmd('gps', 'git push', 'Push code to remote'),
    cmd('gpl', 'git pull', 'Pull code from remote'),
    cmd('gs', 'git status', 'Show status in table format'),
    cmd('gh', '-', 'Show this help message'),
    section('Branch'),
    cmd('gbl', 'git branch', 'List branches in table'),
    cmd('gbc', 'git switch <b>', 'Switch to branch'),
    cmd('gbn', 'git switch -c <b>', 'Create & switch branch'),
    cmd('gbm', 'git merge <b>', 'Merge branch'),
    cmd('gbr', 'git rebase <b>', 'Rebase onto branch'),
    cmd('gbd', 'git branch -D <b>', 'Delete branch'),
    section('Staging'),
    cmd('gfa', 'git add <f>', 'Stage files interactively'),
    cmd('gfd', 'git restore --staged <f>', 'Unstage files'),
    cmd('gfr', 'git checkout HEAD -- <f>', 'Revert to HEAD'),
    cmd('gfc', 'git diff <f>', 'Show file diff'),
    section('Commit'),
    cmd('gc', 'git commit -m <m>', 'Commit with LLM message'),
    cmd('gcs', '-', 'Generate commit summary'),
    cmd('gl', 'git log -n <n>', 'Show logs in table'),
    cmd('gld', 'git diff <c>', 'Show commit diff'),
    section('Stash'),
    cmd('gsl', 'git stash list', 'List stashes in table'),
    cmd('gsa', 'git stash push -m <m>', 'Create stash'),
    cmd('gsp', 'git stash pop', 'Pop latest stash'),
    cmd('gss', 'git stash show -p <s>', 'Show stash details'),
    cmd('gsu', 'git stash apply <s>', 'Apply stash'),
    cmd('gsd', 'git stash drop <s>', 'Drop stash'),
    section('Tag'),
    cmd('gts', 'git show <t>', 'Show tag details'),
]

const printHeader = () => {
    const title = 'Git Alias Command Reference'
    const line = '═'.repeat(title.length + 4)
    console.log()
    console.log(color.mauve.bold(`  ╭${line}╮`))
    console.log(color.mauve.bold(`  │  ${title}  │`))
    console.log(color.mauve.bold(`  ╰${line}╯`))
    console.log()
}

const printFooter = () => {
    console.log()
    console.log(
        color.sky('  💡 ') +
            color.subtext0(
                'Tip: All commands support interactive selection with fuzzy search'
            )
    )
    console.log(
        color.sky('  🔗 ') +
            color.subtext0('Repo: https://github.com/vhxnif/git-alias')
    )
    console.log()
}

new Command()
    .name('gh')
    .action(() => {
        printHeader()
        printTable(makeTableData(), tableConfig({ cols: [1, 2, 2] }))
        printFooter()
    })
    .parseAsync()

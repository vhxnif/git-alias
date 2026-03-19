#!/usr/bin/env bun
import { Command } from 'commander'
import { type Branch, branchAction, gitSwitch } from '../action/branch-command'
import { logcmd } from '../utils/command-log-format'
import { errParse, isEmpty } from '../utils/common-utils'

new Command()
    .name('gbn')
    .description('git switch -c <name> / git switch -t <name>')
    .argument('<name>', 'barnch name')
    .option('-t, --track', 'git switch -t', false)
    .action(async (name, { track }) => {
        if (track) {
            await branchAction({
                name,
                all: true,
                command: async (branch: Branch) => {
                    logcmd(
                        await gitSwitch({ branch, args: ['-t'] }),
                        'git-switch'
                    )
                },
                branchFilter: (b) => !b.isCurrent && isEmpty(b.upstream),
            })
            return
        }
        logcmd(
            await gitSwitch({
                branch: { name, isCurrent: true, upstream: '', track: '' },
                args: ['-c'],
            }),
            'git-switch'
        )
    })
    .parseAsync()
    .catch(errParse)

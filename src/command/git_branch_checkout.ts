#!/usr/bin/env bun
import type { ShellError } from 'bun'
import { Command } from 'commander'
import {
    type Branch,
    branchAction,
    branchHistory,
    gitSwitch,
} from '../action/branch-command'
import { rule } from '../store/branch-history-store'
import { color } from '../utils/color-utils'
import { logcmd } from '../utils/command-log-format'
import { calculateBranchMatchScore, errParse } from '../utils/common-utils'
import { OraShow } from '../utils/ora-show'
import { exec, tryExec } from '../utils/platform-utils'

const bs = await branchHistory()

new Command()
    .name('gbc')
    .description('git switch <name>')
    .argument('[name]', 'barnch name', '')
    .option('-f, --force')
    .action(async (name, { force }) => {
        if (name && !force) {
            const currentBranch = await exec('git branch --show-current')
            const candidates = bs
                .query(name)
                .filter((b) => b.name !== currentBranch)
            if (candidates.length > 0) {
                // Calculate match score for each candidate
                const scored = candidates.map((branch) => {
                    const isRemote =
                        branch.name.startsWith('remotes/') ||
                        branch.name.startsWith('origin/')
                    const matchResult = calculateBranchMatchScore(
                        name,
                        branch.name,
                        isRemote
                    )

                    // Weight factors:
                    // - Exact word match: 5x
                    // - Starts with: 3x
                    // - Contains: 1x
                    // - Local branch: 1.5x, Remote: 1x
                    const typeWeight =
                        matchResult.type === 'exact-word'
                            ? 5
                            : matchResult.type === 'starts-with'
                              ? 3
                              : 1
                    const branchWeight = matchResult.isLocal ? 1.5 : 1
                    const historyScore = rule(branch)

                    // Final score: history score weighted by match quality
                    const totalScore =
                        historyScore *
                        typeWeight *
                        matchResult.distanceScore *
                        branchWeight

                    return { branch, score: totalScore, matchResult }
                })

                // Sort by score descending and get best match
                scored.sort((a, b) => b.score - a.score)
                const best = scored[0]

                const spinner = new OraShow(`Switching branch...`)
                spinner.start()
                const { name: branchName, frequency } = best.branch
                try {
                    const result = await tryExec(`git switch ${branchName}`)
                    spinner.succeed(
                        `Switched to branch: ${color.mauve.bold(branchName)}`
                    )
                    logcmd(result, 'git-switch')
                    bs.update(branchName, frequency)
                    return
                } catch (err: unknown) {
                    const msg = (err as ShellError).stderr.toString()
                    spinner.fail(
                        `Failed to switch to branch: ${color.mauve.bold(branchName)}`
                    )
                    console.error(color.red(msg))
                    if (msg.startsWith('fatal: invalid reference:')) {
                        bs.delete(branchName)
                    }
                    // Exit after showing error
                    return
                } finally {
                    spinner.stop()
                }
            }
        }
        await branchAction({
            name,
            command: async (branch: Branch) => {
                const spinner = new OraShow(
                    `Switching to ${color.mauve.bold(branch.name)}...`
                )
                spinner.start()
                try {
                    bs.addOrUpdate(branch.name)
                    const result = await gitSwitch({ branch })
                    spinner.succeed(
                        `Switched to branch: ${color.mauve.bold(branch.name)}`
                    )
                    logcmd(result, 'git-switch')
                } finally {
                    spinner.stop()
                }
            },
        })
    })
    .parseAsync()
    .catch(errParse)
    .finally(() => {
        if (bs) {
            bs.close()
        }
    })

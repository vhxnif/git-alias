#!/usr/bin/env bun
import { Command } from 'commander'
import { fileStaged, fileStatus } from '../action/file-command'
import type { ILLMClient } from '../llm/llm-types'
import { OllamaClient } from '../llm/ollama-client'
import { OpenAiClient } from '../llm/open-ai-client'
import { color } from '../utils/color-utils'
import { errParse, isEmpty, printErr } from '../utils/common-utils'
import { OraShow } from '../utils/ora-show'
import { editor, exec, execPrint } from '../utils/platform-utils'
import { gitCommitMessage, gitDiffSummary } from '../utils/prompt'

const client: ILLMClient =
    process.env.ALIAS_TYPE === 'ollama'
        ? new OllamaClient()
        : new OpenAiClient()

async function commitWithMessage() {
    await stagedDiffAnalyzing(async (diff, spinner) => {
        await client.call({
            messages: [client.system(gitCommitMessage), client.user(diff)],
            model: client.defaultModel(),
            f: async (str: string) => {
                spinner.stop()
                await editor(
                    str,
                    async (tmpPath) =>
                        await execPrint(`git commit -F "${tmpPath}"`)
                )
            },
        })
    })
}

async function codeReview() {
    await stagedDiffAnalyzing(async (diff, spinner) => {
        await client.stream({
            messages: [client.system(gitDiffSummary), client.user(diff)],
            model: client.defaultModel(),
            f: async (str: string) => {
                spinner.stop()
                process.stdout.write(color.green(str))
            },
        })
    })
}

type DiffAnalysisCallback = (diff: string, spinner: OraShow) => Promise<void>
async function stagedDiffAnalyzing(
    callback: DiffAnalysisCallback
): Promise<void> {
    const spinner = new OraShow(color.blue.bold('Extract Git Diff...'))
    spinner.start()
    const diff = await exec(`git diff --staged`)
    if (isEmpty(diff)) {
        spinner.stop()
        throw new Error(`There are not changes.`)
    }
    spinner.show(color.mauve.bold('Analyzing...'))
    await callback(diff, spinner)
}

new Command()
    .name('gc')
    .description('git commit -m')
    .option('-m, --message <message>', 'commit message not use ai summary')
    .option('-r, --review', 'code review')
    .action(async (options) => {
        const { message, review } = options
        if (review) {
            await codeReview()
            return
        }
        const stageFile = await fileStatus().then((it) => it.filter(fileStaged))
        if (isEmpty(stageFile)) {
            printErr('No Staged Changes To Commit.')
            return
        }
        if (message) {
            await execPrint(`git commit -m "${message}"`)
            return
        }
        await commitWithMessage()
    })
    .parseAsync()
    .catch(errParse)

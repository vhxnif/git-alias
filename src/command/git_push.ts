#!/usr/bin/env bun
import { Command } from 'commander'
import { errParse } from '../utils/common-utils'
import { execPrint } from '../utils/platform-utils'

new Command()
    .name('gps')
    .description('git push')
    .argument('[remote]', 'remote name')
    .action(async (remote) => {
        await execPrint(`git push ${remote ?? 'origin'}`)
    })
    .parseAsync()
    .catch(errParse)

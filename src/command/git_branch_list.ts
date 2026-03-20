#!/usr/bin/env bun
import { Command } from 'commander'
import { type Branch, branchList } from '../action/branch-command'
import { table } from '../table'
import { color, tableTitle } from '../utils/color-utils'
import { errParse, isEmpty } from '../utils/common-utils'
import { default as page } from '../utils/page-prompt'
import { tableDataPartation } from '../utils/table-utils'

function trackParse(track: string): string {
    const { red, green, blue, yellow } = color
    const str = track.substring(1, track.length - 1)

    if (str === 'gone') {
        return red('⚠')
    }

    const parts = str.includes(',')
        ? str.split(',').map((p) => p.trim())
        : [str]

    let ahead: string | undefined
    let behind: string | undefined

    for (const part of parts) {
        const match = part.match(/^(ahead|behind)\s+(\d+)$/)
        if (match) {
            if (match[1] === 'ahead') {
                ahead = match[2]
            } else {
                behind = match[2]
            }
        }
    }

    const result: string[] = []
    if (ahead && ahead !== '0') {
        result.push(`${yellow('↑')}${green(ahead)}`)
    }
    if (behind && behind !== '0') {
        result.push(`${yellow('↓')}${blue(behind)}`)
    }

    return result.join(' ')
}

function branchParse(bs: Branch[]): string[][] {
    return bs.map((it) => {
        const { isCurrent, name, upstream, track } = it
        const prefix = isCurrent ? '★ ' : '  '
        const branchName = isCurrent
            ? color.yellow(`${prefix}${name}`)
            : color.blue(`${prefix}${name}`)
        const upstreamName = isEmpty(upstream)
            ? color.overlay0('-')
            : color.mauve(upstream)
        const trackInfo = isEmpty(track) ? '' : trackParse(track)

        return [branchName, upstreamName, trackInfo]
    })
}

function tableParse(arr: string[][][]): string[] {
    const config = table.autoLayout({ columnRatios: [3, 3, 1] })
    return arr.map((it) => {
        return table.render(
            [tableTitle(['Branch', 'Upstream', 'Track']), ...it],
            config
        )
    })
}

new Command()
    .name('gbl')
    .description('git branch -l / git branch -a')
    .argument('[name]', 'barnch name', '')
    .option('-a, --all', 'list all', false)
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

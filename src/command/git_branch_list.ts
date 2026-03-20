#!/usr/bin/env bun
import { Command } from 'commander'
import { type Branch, branchList } from '../action/branch-command'
import { color } from '../utils/color-utils'
import { errParse, isEmpty } from '../utils/common-utils'
import treeSelect, { type TreeNode } from '../utils/tree-select'

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

function buildBranchTree(branches: Branch[]): TreeNode<Branch>[] {
    const remotePattern = /^(origin|upstream|fork)\//
    const remoteBranches = branches.filter((b) => remotePattern.test(b.name))
    const localBranches = branches.filter((b) => !remotePattern.test(b.name))

    const localChildren: TreeNode<Branch>[] = localBranches.map((b) => ({
        id: `local-${b.name}`,
        label: b.name,
        rawLabel: b.name,
        value: b,
        isLeaf: true,
        isCurrent: b.isCurrent,
        formatInfo: isEmpty(b.track) ? undefined : trackParse(b.track),
    }))

    const remoteChildren: TreeNode<Branch>[] = remoteBranches.map((b) => ({
        id: `remote-${b.name}`,
        label: b.name,
        rawLabel: b.name,
        value: b,
        isLeaf: true,
        isCurrent: b.isCurrent,
        formatInfo: isEmpty(b.track) ? undefined : trackParse(b.track),
    }))

    const tree: TreeNode<Branch>[] = []

    if (localChildren.length > 0) {
        tree.push({
            id: 'local-root',
            label: 'Local Branches',
            children: localChildren,
            expanded: true,
        })
    }

    if (remoteChildren.length > 0) {
        tree.push({
            id: 'remote-root',
            label: 'Remote Branches',
            children: remoteChildren,
            expanded: false,
        })
    }

    return tree
}

new Command()
    .name('gbl')
    .description('git branch -l / git branch -a')
    .argument('[name]', 'branch name', '')
    .option('-a, --all', 'list all', false)
    .action(async (name, { all }) => {
        const branches = await branchList({
            name,
            all,
        })

        const tree = buildBranchTree(branches)

        const result = await treeSelect({
            message: 'Branch List',
            tree,
            pageSize: 15,
            simplifyLabels: true,
            splitBySlash: true,
        })

        if (result.type === 'cancelled') {
            return
        }
    })
    .parseAsync()
    .catch(errParse)

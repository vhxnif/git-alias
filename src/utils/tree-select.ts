import { createPrompt, useKeypress, useMemo, useState } from '@inquirer/core'
import chalk from 'chalk'
import { color } from './color-utils'
import { exit } from './platform-utils'

export type TreeNode<T> = {
    id: string
    label: string
    value?: T
    children?: TreeNode<T>[]
    expanded?: boolean
    isLeaf?: boolean
    rawLabel?: string
    formatInfo?: string
    isCurrent?: boolean
}

export type TreeSelectConfig<T> = {
    message: string
    tree: TreeNode<T>[]
    pageSize?: number
    splitBySlash?: boolean
    simplifyLabels?: boolean
}

export type TreeSelectResult<T> = { type: 'selected'; node: TreeNode<T> }

type FlatNode<T> = {
    node: TreeNode<T>
    depth: number
}

function findCurrentBranch<T>(nodes: TreeNode<T>[]): {
    expandedIds: Set<string>
    selectedId: string | null
} {
    const expandedIds = new Set<string>()
    let selectedId: string | null = null

    function traverse(nodes: TreeNode<T>[], parentIds: string[]): boolean {
        for (const node of nodes) {
            if (node.isCurrent) {
                for (const id of parentIds) {
                    expandedIds.add(id)
                }
                selectedId = node.id
                return true
            }
            if (node.children) {
                if (traverse(node.children, [...parentIds, node.id])) {
                    return true
                }
            }
        }
        return false
    }

    traverse(nodes, [])
    return { expandedIds, selectedId }
}

function simplifyLabel(label: string): string {
    return label.replace(/\s*Branches?\s*/gi, ' ').trim() || label
}

function simplifyLabelsInTree<T>(nodes: TreeNode<T>[]): TreeNode<T>[] {
    return nodes.map((node) => {
        const isFolder = node.children && node.children.length > 0
        return {
            ...node,
            label: isFolder ? simplifyLabel(node.label) : node.label,
            children: node.children
                ? simplifyLabelsInTree(node.children)
                : undefined,
        }
    })
}

function buildTreeFromSlashPaths<T>(nodes: TreeNode<T>[]): TreeNode<T>[] {
    const result: TreeNode<T>[] = []
    const nodeMap = new Map<string, TreeNode<T>>()

    for (const node of nodes) {
        const rawLabel = node.rawLabel || node.label
        const parts = rawLabel.split('/').filter(Boolean)

        if (parts.length <= 1) {
            const processedNode: TreeNode<T> = {
                ...node,
                children: node.children
                    ? buildTreeFromSlashPaths(node.children)
                    : undefined,
            }
            result.push(processedNode)
            continue
        }

        const leafPart = parts[parts.length - 1]
        let currentPath = ''
        let parentArray = result

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i]
            currentPath = currentPath ? `${currentPath}/${part}` : part
            const folderId = `folder:${currentPath}`

            if (!nodeMap.has(folderId)) {
                const folderNode: TreeNode<T> = {
                    id: folderId,
                    label: part,
                    expanded: i === 0,
                    children: [],
                    isLeaf: false,
                }
                nodeMap.set(folderId, folderNode)
                parentArray.push(folderNode)
            }

            const existing = nodeMap.get(folderId)
            if (!existing) continue
            if (!existing.children) {
                existing.children = []
            }
            parentArray = existing.children
        }

        const leafNode: TreeNode<T> = {
            ...node,
            label: leafPart,
            rawLabel: rawLabel,
            isLeaf: true,
        }
        nodeMap.set(node.id, leafNode)
        parentArray.push(leafNode)
    }

    return result
}

function flattenTree<T>(
    nodes: TreeNode<T>[],
    expandedIds: Set<string>,
    depth: number = 0
): FlatNode<T>[] {
    const result: FlatNode<T>[] = []

    for (const node of nodes) {
        result.push({ node, depth })

        if (
            node.children &&
            node.children.length > 0 &&
            expandedIds.has(node.id)
        ) {
            result.push(...flattenTree(node.children, expandedIds, depth + 1))
        }
    }

    return result
}

function sortTreeNodes<T>(nodes: TreeNode<T>[]): TreeNode<T>[] {
    const sortFn = (a: TreeNode<T>, b: TreeNode<T>) => {
        const aIsFolder = !!a.children?.length
        const bIsFolder = !!b.children?.length
        if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1
        return a.label.localeCompare(b.label)
    }

    return nodes
        .map((node) => {
            if (node.children?.length) {
                return { ...node, children: sortTreeNodes(node.children) }
            }
            return node
        })
        .sort(sortFn)
}

function collectAllFolderIds<T>(nodes: TreeNode<T>[], ids: Set<string>): void {
    for (const node of nodes) {
        if (node.children && node.children.length > 0) {
            ids.add(node.id)
            collectAllFolderIds(node.children, ids)
        }
    }
}

function findNodeIndex<T>(nodes: FlatNode<T>[], id: string | null): number {
    if (!id) return 0
    const idx = nodes.findIndex((fn) => fn.node.id === id)
    return Math.max(0, Math.min(idx, nodes.length - 1))
}

function highlightMatch(text: string, term: string): string {
    if (!term) return text
    const lowerText = text.toLowerCase()
    const lowerTerm = term.toLowerCase()
    const idx = lowerText.indexOf(lowerTerm)
    if (idx === -1) return text

    const before = text.slice(0, idx)
    const match = text.slice(idx, idx + term.length)
    const after = text.slice(idx + term.length)
    return `${before}${chalk.bgHex('#3b3b4f')(match)}${after}`
}

function renderTreeLine<T>(
    flatNode: FlatNode<T>,
    isSelected: boolean,
    searchTerm: string = ''
): string {
    const { node, depth } = flatNode
    const { yellow, blue, green, overlay0 } = color

    const indent = '  '.repeat(depth)
    const isLeaf = !node.children || node.children.length === 0

    const prefix = isSelected ? '> ' : '  '

    let icon = ''
    if (!isLeaf) {
        icon = node.expanded ? '📂 ' : '📁 '
    } else {
        icon = node.isCurrent ? '★ ' : '  '
    }

    const rawLabel = node.label
    let label = isSelected
        ? yellow.bold(rawLabel)
        : isLeaf
          ? blue(rawLabel)
          : green(rawLabel)

    if (searchTerm) {
        label = highlightMatch(rawLabel, searchTerm)
    }

    let display = `${overlay0(indent)}${prefix}${icon}${label}`

    if (isLeaf && node.formatInfo) {
        display += ` ${overlay0('[')}${node.formatInfo}${overlay0(']')}`
    }

    return display
}

function getVisibleRange(
    currentIndex: number,
    totalNodes: number,
    pageSize: number
): { start: number; end: number } {
    if (totalNodes <= pageSize) {
        return { start: 0, end: totalNodes }
    }

    const halfPage = Math.floor(pageSize / 2)
    let start = Math.max(0, currentIndex - halfPage)
    const end = Math.min(totalNodes, start + pageSize)

    if (end === totalNodes) {
        start = Math.max(0, totalNodes - pageSize)
    }

    return { start, end }
}

function filterTreeNodes<T>(
    nodes: FlatNode<T>[],
    term: string
): {
    filtered: FlatNode<T>[]
    matchedFolderIds: Set<string>
} {
    if (!term) return { filtered: nodes, matchedFolderIds: new Set() }
    const lower = term.toLowerCase()
    const matchedFolderIds = new Set<string>()
    const filtered = nodes.filter((fn) => {
        const isMatch = fn.node.label.toLowerCase().includes(lower)
        if (isMatch && fn.node.children?.length) {
            matchedFolderIds.add(fn.node.id)
        }
        return isMatch
    })
    return { filtered, matchedFolderIds }
}

// biome-ignore lint/suspicious/noExplicitAny: generic UI component accepts any value type
export default createPrompt<TreeSelectResult<any>, TreeSelectConfig<any>>(
    (config, done) => {
        const {
            message,
            tree: inputTree,
            pageSize = 10,
            splitBySlash = false,
            simplifyLabels = false,
        } = config

        const processedTree = useMemo(() => {
            let tree = inputTree
            if (splitBySlash) {
                tree = buildTreeFromSlashPaths(tree)
            }
            if (simplifyLabels) {
                tree = simplifyLabelsInTree(tree)
            }
            return tree
        }, [inputTree, splitBySlash, simplifyLabels])

        // biome-ignore lint/suspicious/noExplicitAny: generic UI component accepts any value type
        const [tree] = useState<TreeNode<any>[]>(processedTree)
        const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
            const { expandedIds } = findCurrentBranch(processedTree)
            return expandedIds
        })
        const [selectedId, setSelectedId] = useState<string | null>(() => {
            const { selectedId } = findCurrentBranch(processedTree)
            return selectedId
        })
        const [quit, setQuit] = useState(false)
        const [searchMode, setSearchMode] = useState(false)
        const [searchTerm, setSearchTerm] = useState('')

        const sortedTree = useMemo(() => sortTreeNodes(tree), [tree])
        const flatNodes = useMemo(
            () => flattenTree(sortedTree, expandedIds),
            [sortedTree, expandedIds]
        )

        if (flatNodes.length === 0) {
            exit()
            return ''
        }

        const safeIndex = findNodeIndex(flatNodes, selectedId)

        useKeypress((key, rl) => {
            rl.clearLine(0)

            const isKey = (str: string) => key.name === str

            if (searchMode) {
                if (isKey('q')) {
                    setQuit(true)
                    exit()
                    return
                }
                if (isKey('escape')) {
                    setSearchMode(false)
                    setSearchTerm('')
                } else if (isKey('return')) {
                    const searchResult = filterTreeNodes(flatNodes, searchTerm)
                    const displayNodes = searchResult.filtered
                    const currentIdx = findNodeIndex(displayNodes, selectedId)
                    const currentNode = displayNodes[currentIdx]?.node
                    if (currentNode?.children?.length) {
                        const nextExpanded = new Set<string>(expandedIds)
                        nextExpanded.add(currentNode.id)
                        setExpandedIds(nextExpanded)
                        const sorted = sortTreeNodes(tree)
                        const expanded = flattenTree(sorted, nextExpanded)
                        const firstChild = expanded.find(
                            (fn) =>
                                fn.node.id !== currentNode.id && fn.depth > 0
                        )
                        if (firstChild) {
                            setSelectedId(firstChild.node.id)
                        }
                    }
                    setSearchMode(false)
                    setSearchTerm('')
                } else if (isKey('backspace')) {
                    setSearchTerm(searchTerm.slice(0, -1))
                } else if (key.name && key.name.length === 1 && !key.ctrl) {
                    setSearchTerm(searchTerm + key.name)
                }
                return
            }

            if (isKey('q') || isKey('escape')) {
                setQuit(true)
                exit()
                return
            }

            if (isKey('s')) {
                setSearchMode(true)
                return
            }

            const currentIdx = findNodeIndex(flatNodes, selectedId)

            if (isKey('j')) {
                const nextIndex = Math.min(currentIdx + 1, flatNodes.length - 1)
                setSelectedId(flatNodes[nextIndex].node.id)
            } else if (isKey('k')) {
                const prevIndex = Math.max(currentIdx - 1, 0)
                setSelectedId(flatNodes[prevIndex].node.id)
            } else if (isKey('space')) {
                const currentNode = flatNodes[currentIdx].node
                if (currentNode.children && currentNode.children.length > 0) {
                    const nextExpanded = new Set<string>(expandedIds)
                    if (nextExpanded.has(currentNode.id)) {
                        nextExpanded.delete(currentNode.id)
                    } else {
                        nextExpanded.add(currentNode.id)
                    }
                    setExpandedIds(nextExpanded)
                }
            } else if (isKey('e')) {
                const nextExpanded = new Set<string>(expandedIds)
                collectAllFolderIds(tree, nextExpanded)
                setExpandedIds(nextExpanded)
            } else if (isKey('c')) {
                setExpandedIds(new Set<string>())
            } else if (isKey('return')) {
                const currentNode = flatNodes[currentIdx].node
                if (
                    !currentNode.children ||
                    currentNode.children.length === 0
                ) {
                    done({ type: 'selected', node: currentNode })
                }
            }
        })

        if (quit) {
            return ''
        }

        const { green, surface2, yellow } = color

        const searchResult = searchMode
            ? filterTreeNodes(flatNodes, searchTerm)
            : { filtered: flatNodes, matchedFolderIds: new Set<string>() }
        const displayNodes = searchResult.filtered

        if (displayNodes.length === 0 && searchMode) {
            const { teal, blue } = color
            const key = (desc: string, k: string) => `${desc}${teal(`<${k}>`)}`
            return [
                `${green.bold(message)} ${yellow('[Search]')}`,
                surface2('No matching results'),
                '',
                `${key('Search: ', searchTerm)}_`,
                '',
                `${key('', 'esc')} ${blue('cancel search')}`,
            ].join('\n')
        }

        const displayIndex = searchMode
            ? findNodeIndex(displayNodes, selectedId)
            : safeIndex

        const { start, end } = getVisibleRange(
            displayIndex,
            displayNodes.length,
            pageSize
        )
        const visibleNodes = displayNodes.slice(start, end)

        // biome-ignore lint/suspicious/noExplicitAny: generic UI component accepts any value type
        const treeLines = visibleNodes.map((flatNode: FlatNode<any>) => {
            const isSelected = flatNode.node.id === selectedId
            return renderTreeLine(flatNode, isSelected, searchTerm)
        })

        const pageIndicator =
            displayNodes.length > pageSize
                ? ` ${surface2(`[${start + 1}-${end}/${displayNodes.length}]`)}`
                : ''

        const searchIndicator = searchMode ? ` ${yellow('[Search]')}` : ''
        const { teal, blue } = color
        const key = (desc: string, k: string) => `${desc}${teal(`<${k}>`)}`

        if (searchMode) {
            return [
                `${green.bold(message)}${pageIndicator}${searchIndicator}`,
                '',
                `${key('Search: ', searchTerm)}_`,
                '',
                ...treeLines,
                '',
                `${key('', 'enter/esc')} ${blue('finish search')}`,
            ].join('\n')
        }

        const navHelp = `${key('Navigate: ', 'j/k')} ${blue('move')}  ${key('', 'space')} ${blue('toggle')}  ${key('', 'e/c')} ${blue('expand/collapse')}`
        const actionHelp = `${key('Actions:  ', 's')} ${blue('search')}  ${key('', 'enter')} ${blue('select')}  ${key('', 'q')} ${blue('quit')}`

        return [
            `${green.bold(message)}${pageIndicator}`,
            ...treeLines,
            '',
            navHelp,
            actionHelp,
        ].join('\n')
    }
)

import { table } from '../table'
import type { TableAlignment, TableConfig } from '../table/table-port'

/**
 * 表格配置构建函数
 * 根据列比例和终端宽度自动计算列宽
 * @deprecated 推荐使用 table.autoLayout()
 */
const tableConfig = ({
    cols,
    alignment,
    maxColumn,
}: {
    cols: number[]
    alignment?: TableAlignment
    maxColumn?: number
}): TableConfig => {
    const config = table.autoLayout({ columnRatios: cols, alignment })
    // 如果指定了 maxColumn，需要重新计算列宽
    if (maxColumn !== undefined && config.columns) {
        const sum = cols.reduce((acc, it) => acc + it, 0)
        const colNum = maxColumn - 4 * cols.length
        const calWidth = cols.map((it) => Math.floor(colNum * (it / sum)))
        return {
            ...config,
            columns: calWidth.map((width) => ({
                alignment: alignment ?? 'justify',
                width,
            })),
        }
    }
    return config
}

/**
 * 打印表格到控制台
 * @deprecated 推荐使用 table.print()
 */
const printTable = (data: unknown[][], userConfig?: TableConfig) =>
    table.print(data, userConfig)

/**
 * 将数据分页
 * @deprecated 推荐使用 table.partition()
 */
function tableDataPartation<T>(data: T[], pageSize: number = 5): T[][] {
    return table.partition(data, pageSize)
}

/** 默认表格配置 */
const tableDefaultConfig = table.getDefaultConfig()

/** 默认列宽 */
const tableColumnWidth = table.getMaxColumnWidth()

export {
    printTable,
    tableColumnWidth,
    tableConfig,
    tableDataPartation,
    tableDefaultConfig,
}

/**
 * Table 防腐层接口定义
 * 定义表格渲染的抽象接口，便于未来更换底层实现
 */

/** 单元格对齐方式 */
export type TableAlignment = 'left' | 'center' | 'right' | 'justify'

/** 列配置 */
export interface TableColumnConfig {
    alignment?: TableAlignment
    width?: number
}

/** 表格配置 - 最小化抽象，不包含具体库特有的配置 */
export interface TableConfig {
    columns?: TableColumnConfig[]
    border?: TableBorderConfig
}

/** 表格边框样式配置 */
export interface TableBorderConfig {
    topBody: string
    topJoin: string
    topLeft: string
    topRight: string
    bottomBody: string
    bottomJoin: string
    bottomLeft: string
    bottomRight: string
    bodyLeft: string
    bodyRight: string
    bodyJoin: string
    joinBody: string
    joinLeft: string
    joinRight: string
    joinJoin: string
}

/** 表格布局配置 - 与具体 table 库无关 */
export interface TableLayoutConfig {
    /** 各列的宽度比例，如 [1, 2, 1] 表示三列宽度比例为 1:2:1 */
    columnRatios: number[]
    /** 单元格内容对齐方式 */
    alignment?: TableAlignment
}

/** 表格数据类型 */
export type TableRow = unknown[]
export type TableData = TableRow[]

/** Table 渲染器接口 */
export interface ITableRenderer {
    /** 渲染表格为字符串 */
    render(data: TableData, config?: TableConfig): string
    /** 直接打印表格到控制台 */
    print(data: TableData, config?: TableConfig): void
}

/** Table 配置构建器接口 */
export interface ITableConfigBuilder {
    /** 根据终端宽度和列比例自动计算列宽 */
    autoLayout(layout: TableLayoutConfig): TableConfig
    /** 获取默认配置 */
    getDefaultConfig(): TableConfig
}

/** Table 工具接口 */
export interface ITableUtils {
    /** 将数据分页 */
    partition<T>(data: T[], pageSize: number): T[][]
    /** 获取终端可用最大列宽 */
    getMaxColumnWidth(): number
}

/** 完整的 Table Port 接口 */
export interface ITablePort
    extends ITableRenderer,
        ITableConfigBuilder,
        ITableUtils {}

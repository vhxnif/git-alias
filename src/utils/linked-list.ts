export type Node<T> = {
    value: T
    idx: number
    next: Node<T> | null
    prev: Node<T> | null
}

export class LinkedList<T> {
    private size: number = 0
    private header: Node<T> | null = null
    private tail: Node<T> | null = null

    constructor(arr: T[]) {
        arr.forEach((it, idx) => {
            this.append(it, idx)
        })
    }

    private append(v: T, idx: number) {
        const n: Node<T> = {
            value: v,
            idx: idx,
            next: null,
            prev: null,
        }
        if (!this.header) {
            this.header = this.tail = n
        } else {
            // biome-ignore lint/style/noNonNullAssertion: tail is guaranteed non-null when header exists
            this.tail!.next = n
            n.prev = this.tail
            this.tail = n
        }
        this.size++
    }

    getSize() {
        return this.size
    }

    getHeader() {
        return this.header
    }

    getTail() {
        return this.tail
    }
}

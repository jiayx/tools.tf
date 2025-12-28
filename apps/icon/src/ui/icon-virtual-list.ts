type IconVirtualListOptions<T = string> = {
  container: HTMLElement
  rowHeight: number
  overscan?: number
  renderRow: (name: string, group: T) => HTMLElement
}

export class IconVirtualList<T = string> {
  private container: HTMLElement
  private spacer: HTMLDivElement
  private list: HTMLDivElement
  private rowHeight: number
  private overscan: number
  private renderRow: IconVirtualListOptions<T>['renderRow']
  private names: string[] = []
  private group: T
  private lastStart = -1
  private lastEnd = -1

  constructor(options: IconVirtualListOptions<T>) {
    this.container = options.container
    this.rowHeight = options.rowHeight
    this.overscan = options.overscan ?? 6
    this.renderRow = options.renderRow
    this.group = undefined as unknown as T

    this.spacer = document.createElement('div')
    this.spacer.className = 'icon-options__spacer'
    this.list = document.createElement('div')
    this.list.className = 'icon-options__list'

    this.container.append(this.spacer, this.list)
    this.onScroll = this.onScroll.bind(this)
    this.container.addEventListener('scroll', this.onScroll)
  }

  setItems(names: string[], group: T) {
    this.names = names
    this.group = group
    this.lastStart = -1
    this.lastEnd = -1
    this.spacer.style.height = `${this.names.length * this.rowHeight}px`
    this.render()
  }

  clear() {
    this.names = []
    this.lastStart = -1
    this.lastEnd = -1
    this.spacer.style.height = '0px'
    this.list.innerHTML = ''
  }

  refresh() {
    this.lastStart = -1
    this.lastEnd = -1
    this.render()
  }

  scrollToName(name: string) {
    const index = this.names.indexOf(name)
    if (index === -1) return
    const target = index * this.rowHeight - this.container.clientHeight / 2 + this.rowHeight / 2
    this.container.scrollTop = Math.max(target, 0)
    this.render()
  }

  private onScroll() {
    this.render()
  }

  private render() {
    const viewportHeight = this.container.clientHeight
    if (!viewportHeight || !this.names.length) {
      this.list.innerHTML = ''
      return
    }

    const scrollTop = this.container.scrollTop
    const startIndex = Math.max(Math.floor(scrollTop / this.rowHeight) - this.overscan, 0)
    const endIndex = Math.min(
      Math.ceil((scrollTop + viewportHeight) / this.rowHeight) + this.overscan,
      this.names.length
    )

    if (startIndex === this.lastStart && endIndex === this.lastEnd) return
    this.lastStart = startIndex
    this.lastEnd = endIndex

    const fragment = document.createDocumentFragment()
    for (let i = startIndex; i < endIndex; i += 1) {
      fragment.append(this.renderRow(this.names[i], this.group))
    }
    this.list.innerHTML = ''
    this.list.append(fragment)
    this.list.style.transform = `translateY(${startIndex * this.rowHeight}px)`
  }
}

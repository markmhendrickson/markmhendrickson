import type { Element, Root, RootContent } from 'hast'

function markedPaperImage(node: RootContent | undefined, marker: 'paper-step' | 'paper-grid'): Element | undefined {
  if (node?.type !== 'element' || node.tagName !== 'p') return
  const [image, ...rest] = node.children
  if (rest.length || image?.type !== 'element' || image.tagName !== 'img') return
  const title = image.properties.title
  if (typeof title === 'string' && title.startsWith(`${marker}|`)) return image
}

/** Render an explicitly marked image using the existing paper figure component. */
function usePaperFigure(image: Element) {
  image.properties.title = String(image.properties.title).replace(/^paper-step\|/, 'paper|')
  return image
}

/** Pair paper steps with their prose and collect consecutive paper grid figures. */
export function rehypePaperLayouts() {
  return (tree: Root) => {
    const blocks = tree.children
    const nextBlock = (index: number) => {
      for (;;) {
        const block = blocks[index]
        if (block?.type !== 'text' || block.value.trim()) return index
        index++
      }
    }

    for (let index = 0; index < blocks.length; index++) {
      const block = blocks[index]
      const firstImage = markedPaperImage(block, 'paper-grid')
      if (firstImage) {
        const images = [firstImage]
        let end = nextBlock(index + 1)
        for (; end < blocks.length; end = nextBlock(end + 1)) {
          const image = markedPaperImage(blocks[end], 'paper-grid')
          if (!image) break
          images.push(image)
        }
        if (images.length > 1) {
          blocks.splice(index, end - index, {
            type: 'element',
            tagName: 'div',
            properties: { className: ['essay-paper-grid'] },
            children: images,
          })
        }
        continue
      }

      if (block.type !== 'element' || block.tagName !== 'h3') continue

      const copy: Element[] = [block]
      for (let end = nextBlock(index + 1); end < blocks.length; end = nextBlock(end + 1)) {
        const paragraph = blocks[end]
        if (paragraph.type !== 'element' || paragraph.tagName !== 'p') break

        const image = markedPaperImage(paragraph, 'paper-step')
        if (image) {
          if (copy.length === 1) break

          blocks.splice(index, end - index + 1, {
            type: 'element',
            tagName: 'div',
            properties: { className: ['essay-paper-step'] },
            children: [
              { type: 'element', tagName: 'div', properties: {}, children: copy },
              usePaperFigure(image),
            ],
          })
          break
        }

        if (paragraph.children.some(child => child.type === 'element' && child.tagName === 'img')) break
        copy.push(paragraph)
      }
    }
  }
}

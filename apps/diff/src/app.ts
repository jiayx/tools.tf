import { history, historyKeymap, defaultKeymap } from '@codemirror/commands'
import { MergeView } from '@codemirror/merge'
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine } from '@codemirror/view'


const leftSample = `The quick brown fox
jumps over the lazy dog.
Diffs are neat.`

const rightSample = `The quick brown fox
jumps over a sleepy dog.
Diffs are neat and fast.
New line here.`

const init = () => {
  const root = document.getElementById('merge-root')
  if (!root) return

  root.textContent = ''

  const baseExtensions = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorView.lineWrapping,
  ]

  new MergeView({
    parent: root,
    a: {
      doc: leftSample,
      extensions: baseExtensions,
    },
    b: {
      doc: rightSample,
      extensions: baseExtensions,
    },
    gutter: true,
    highlightChanges: true,
    collapseUnchanged: {
      margin: 3,
      minSize: 6
    },
    diffConfig: {
      scanLimit: 1000
    }
  })
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
}

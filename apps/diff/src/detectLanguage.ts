import type { SupportedLanguages } from '@pierre/diffs'

const scoreMatch = (code: string, regex: RegExp, points: number) => (regex.test(code) ? points : 0)

export function detectLanguage(code: string): SupportedLanguages | null {
  const source = code.trim()
  if (!source) return null

  const scores = new Map<SupportedLanguages, number>()
  const add = (lang: SupportedLanguages, points: number) => {
    if (points <= 0) return
    scores.set(lang, (scores.get(lang) ?? 0) + points)
  }

  // JSON
  add('json', scoreMatch(source, /^\s*[[{]/, 4))
  add('json', scoreMatch(source, /"[^"]+"\s*:/, 8))

  // YAML
  add('yaml', scoreMatch(source, /^---\s*$/m, 8))
  add('yaml', scoreMatch(source, /^\w[\w\s-]*:\s+\S/m, 6))

  // HTML — avoid treating a lone Javadoc tag like <p> as HTML
  add('html', scoreMatch(source, /<(?:!DOCTYPE|html|head|body|script|style)\b/i, 18))
  add('html', scoreMatch(source, /<(?:div|span|section|main|header|footer|article)\b[^>]*>.*<\/(?:div|span|section|main|header|footer|article)>/is, 14))
  add('html', scoreMatch(source, /<(?:p|a|button|form|input|img|ul|li)\b[^>]*>/i, 4))
  add('html', scoreMatch(source, /<\/[a-z][\w-]*>/i, 6))

  // CSS
  add('css', scoreMatch(source, /[.#]?[\w-]+\s*\{[^}]*:[^}]*\}/s, 12))
  add('css', scoreMatch(source, /(^|\n)\s*@media\b/m, 8))

  // Python
  add('python', scoreMatch(source, /\bdef\s+\w+\s*\(/, 10))
  add('python', scoreMatch(source, /^\s*from\s+\w+(?:\.\w+)*\s+import\s/m, 10))
  add('python', scoreMatch(source, /^\s*import\s+\w+/m, 6))
  add('python', scoreMatch(source, /:\s*(?:\n|#|"""|'')/m, 3))

  // Go
  add('go', scoreMatch(source, /^package\s+\w+/m, 12))
  add('go', scoreMatch(source, /\bfunc\s+\w+\s*\(/, 12))
  add('go', scoreMatch(source, /^import\s*(\(|")/m, 6))

  // Rust
  add('rust', scoreMatch(source, /\bfn\s+\w+\s*\(/, 12))
  add('rust', scoreMatch(source, /^\s*use\s+\w+/m, 8))
  add('rust', scoreMatch(source, /\b(?:let|match|impl|trait)\b/, 5))

  // TSX / JSX
  add('tsx', scoreMatch(source, /<[A-Z]\w*[\s/>]/, 10))
  add('tsx', scoreMatch(source, /:\s*(?:string|number|boolean|React\.|JSX\.|Props\b)/, 8))
  add('tsx', scoreMatch(source, /\b(?:export\s+)?function\s+[A-Z]\w*\s*\([^)]*:\s*[^)]*\)\s*\{/, 10))
  add('tsx', scoreMatch(source, /\breturn\s*\([\s\S]*<\w+[\s\S]*\{[^}]+\}[\s\S]*\)/, 12))
  add('tsx', scoreMatch(source, /\breturn\s+<\w+[\s\S]*\{[^}]+\}/, 12))
  add('tsx', scoreMatch(source, /\breturn\s*\([\s\S]*<[A-Za-z]/, 5))
  add('tsx', scoreMatch(source, /\breturn\s+<[A-Za-z]/, 5))

  add('jsx', scoreMatch(source, /<[A-Z]\w*[\s/>]/, 10))
  add('jsx', scoreMatch(source, /\b(?:export\s+)?function\s+[A-Z]\w*\s*\(/, 8))
  add('jsx', scoreMatch(source, /\breturn\s*\([\s\S]*<\w+[\s\S]*\{[^}]+\}[\s\S]*\)/, 10))
  add('jsx', scoreMatch(source, /\breturn\s+<\w+[\s\S]*\{[^}]+\}/, 10))
  add('jsx', scoreMatch(source, /\breturn\s*\([\s\S]*<[A-Za-z]/, 7))
  add('jsx', scoreMatch(source, /\breturn\s+<[A-Za-z]/, 7))
  add('jsx', scoreMatch(source, /\buseState\(|\buseEffect\(/, 4))

  // TypeScript / JavaScript
  add('typescript', scoreMatch(source, /:\s*(?:string|number|boolean|void|never|unknown|any)\b/, 10))
  add('typescript', scoreMatch(source, /\binterface\s+\w+|\btype\s+\w+\s*=/, 10))
  add('typescript', scoreMatch(source, /\bimplements\s+\w+|\breadonly\b|\bas\s+const\b/, 6))

  add('javascript', scoreMatch(source, /\bconst\s+\w+\s*=|\blet\s+\w+\s*=|\bfunction\s+\w+\s*\(/, 7))
  add('javascript', scoreMatch(source, /=>\s*\{|console\.log\(/, 5))
  add('javascript', scoreMatch(source, /^\s*import\s+.*from\s+['"]/m, 4))

  // Java
  add('java', scoreMatch(source, /^package\s+[\w.]+;/m, 14))
  add('java', scoreMatch(source, /^import\s+[\w.*]+;/m, 10))
  add('java', scoreMatch(source, /\bpublic\s+(?:class|interface|enum|record)\s+\w+/, 14))
  add('java', scoreMatch(source, /\b(?:extends|implements)\s+\w+/, 8))
  add('java', scoreMatch(source, /@(?:Override|Service|Component|Repository|Controller|Autowired)\b/, 7))
  add('java', scoreMatch(source, /\bSystem\.out\.print(?:ln)?\(/, 6))

  // C#
  add('csharp', scoreMatch(source, /^using\s+System/m, 12))
  add('csharp', scoreMatch(source, /\bnamespace\s+\w+/, 10))
  add('csharp', scoreMatch(source, /\bpublic\s+class\s+\w+/, 10))
  add('csharp', scoreMatch(source, /\bget;\s*set;|\basync\s+Task\b/, 7))

  // C / C++
  add('c', scoreMatch(source, /#include\s*<\w+(?:\.h)?>/, 14))
  add('c', scoreMatch(source, /\bint\s+main\s*\(/, 10))
  add('c', scoreMatch(source, /\bprintf\s*\(/, 6))
  add('cpp', scoreMatch(source, /#include\s*<(?:iostream|string|vector|map)>/, 14))
  add('cpp', scoreMatch(source, /\bstd::|\bcout\s*<</, 12))
  add('cpp', scoreMatch(source, /\bclass\s+\w+\s*\{|template\s*</, 6))

  // Shell
  add('shellscript', scoreMatch(source, /^#!/m, 12))
  add('shellscript', scoreMatch(source, /\$\(|\b(?:echo|export|source|grep|awk|sed|fi|then)\b/, 8))

  // SQL
  add('sql', scoreMatch(source, /\b(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/i, 8))
  add('sql', scoreMatch(source, /\b(?:FROM|INTO|TABLE|WHERE|JOIN|GROUP BY|ORDER BY)\b/i, 8))

  // Markdown
  add('markdown', scoreMatch(source, /^#{1,6}\s+.+$/m, 10))
  add('markdown', scoreMatch(source, /^[-*+]\s+.+$/m, 6))
  add('markdown', scoreMatch(source, /^>\s+.+$/m, 6))
  add('markdown', scoreMatch(source, /```[\s\S]*```/, 8))

  let bestLang: SupportedLanguages | null = null
  let bestScore = 0

  for (const [lang, score] of scores) {
    if (score > bestScore) {
      bestLang = lang
      bestScore = score
    }
  }

  return bestScore > 0 ? bestLang : null
}

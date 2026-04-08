import { describe, expect, it } from 'vitest'
import { detectLanguage } from './detectLanguage'

describe('detectLanguage', () => {
  it('returns null for empty input', () => {
    expect(detectLanguage('')).toBeNull()
    expect(detectLanguage('   \n\t  ')).toBeNull()
  })

  it('detects TypeScript', () => {
    const source = `interface User {
  name: string
}

const greet = (user: User): string => {
  return user.name
}
`

    expect(detectLanguage(source)).toBe('typescript')
  })

  it('detects TSX', () => {
    const source = `type Props = { title: string }

export function Card({ title }: Props) {
  return <section><h1>{title}</h1></section>
}
`

    expect(detectLanguage(source)).toBe('tsx')
  })

  it('detects JavaScript', () => {
    const source = `import { sum } from './math'

const run = () => {
  console.log(sum(1, 2))
}
`

    expect(detectLanguage(source)).toBe('javascript')
  })

  it('detects Python', () => {
    const source = `from pathlib import Path

def load_file(name):
    return Path(name).read_text()
`

    expect(detectLanguage(source)).toBe('python')
  })

  it('detects Go', () => {
    const source = `package main

import "fmt"

func main() {
  fmt.Println("hi")
}
`

    expect(detectLanguage(source)).toBe('go')
  })

  it('detects Rust', () => {
    const source = `use std::fmt;

fn main() {
  let value = 1;
  match value {
    _ => {}
  }
}
`

    expect(detectLanguage(source)).toBe('rust')
  })

  it('detects Java instead of HTML for Javadoc tags', () => {
    const source = `package com.jialelian.backend.service.b.impl;

import org.springframework.stereotype.Service;

/**
 * <p>
 * 系统配置 服务实现类
 * </p>
 */
@Service
public class SystemConfigServiceImpl {
  @Override
  public String getConfigByType(String type) {
    return null;
  }
}
`

    expect(detectLanguage(source)).toBe('java')
  })

  it('detects HTML', () => {
    const source = `<!DOCTYPE html>
<html>
  <body>
    <div class="app"><p>Hello</p></div>
  </body>
</html>
`

    expect(detectLanguage(source)).toBe('html')
  })

  it('detects CSS', () => {
    const source = `.card {
  color: #111;
  padding: 12px;
}

@media (max-width: 800px) {
  .card {
    padding: 8px;
  }
}
`

    expect(detectLanguage(source)).toBe('css')
  })

  it('detects JSON', () => {
    const source = `{
  "name": "diff",
  "private": true
}
`

    expect(detectLanguage(source)).toBe('json')
  })

  it('detects YAML', () => {
    const source = `---
name: diff
version: 1
`

    expect(detectLanguage(source)).toBe('yaml')
  })

  it('detects Markdown', () => {
    const source = `# Title

- one
- two

> quote
`

    expect(detectLanguage(source)).toBe('markdown')
  })

  it('detects shell scripts', () => {
    const source = `#!/usr/bin/env bash
export NODE_ENV=production
if [ -f .env ]; then
  echo ok
fi
`

    expect(detectLanguage(source)).toBe('shellscript')
  })

  it('detects JSX without TypeScript annotations', () => {
    const source = `export function App() {
  return <main><Button label={label} /></main>
}
`

    expect(detectLanguage(source)).toBe('jsx')
  })

  it('detects plain HTML instead of JSX', () => {
    const source = `<section>
  <h1>Hello</h1>
  <p>World</p>
</section>
`

    expect(detectLanguage(source)).toBe('html')
  })

  it('detects C', () => {
    const source = `#include <stdio.h>

int main() {
  printf("hello\\n");
  return 0;
}
`

    expect(detectLanguage(source)).toBe('c')
  })

  it('detects C++', () => {
    const source = `#include <iostream>
#include <vector>

class Greeter {
public:
  void run() {
    std::cout << "hi" << std::endl;
  }
};
`

    expect(detectLanguage(source)).toBe('cpp')
  })

  it('detects C#', () => {
    const source = `using System;

namespace DemoApp;

public class User {
  public string Name { get; set; } = string.Empty;
}
`

    expect(detectLanguage(source)).toBe('csharp')
  })

  it('detects Java with package and imports', () => {
    const source = `package com.example.demo;

import java.util.List;

public class UserService {
  public List<String> list() {
    return List.of();
  }
}
`

    expect(detectLanguage(source)).toBe('java')
  })

  it('detects markdown code fences as markdown', () => {
    const source = `# API Notes

\`\`\`ts
const value: string = 'ok'
\`\`\`
`

    expect(detectLanguage(source)).toBe('markdown')
  })

  it('detects shell snippets without shebang', () => {
    const source = `export NODE_ENV=production
if [ -n "$HOME" ]; then
  echo ready
fi
`

    expect(detectLanguage(source)).toBe('shellscript')
  })

  it('detects JSON over JavaScript object literal style content', () => {
    const source = `{
  "items": [1, 2, 3],
  "enabled": true
}
`

    expect(detectLanguage(source)).toBe('json')
  })

  it('detects YAML frontmatter style content', () => {
    const source = `---
title: Diffs
layout: page
published: true
`

    expect(detectLanguage(source)).toBe('yaml')
  })

  it('detects SQL join queries', () => {
    const source = `SELECT u.id, p.name
FROM users u
JOIN profiles p ON p.user_id = u.id
WHERE u.active = true;
`

    expect(detectLanguage(source)).toBe('sql')
  })
})

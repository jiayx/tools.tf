import { describe, expect, it } from 'vitest'
import { detectLanguage } from './detectLanguage'

describe('detectLanguage', () => {
  it('returns null for empty input', () => {
    expect(detectLanguage('')).toBeNull()
    expect(detectLanguage('   \n\t  ')).toBeNull()
  })

  it.each([
    [
      "detects TypeScript",
      `interface User {
  name: string
}

const greet = (user: User): string => {
  return user.name
}`,
      "typescript",
    ],
    [
      "detects TSX",
      `type Props = { title: string }

export function Card({ title }: Props) {
  return <section><h1>{title}</h1></section>
}`,
      "tsx",
    ],
    [
      "detects JavaScript",
      `import { sum } from './math'

const run = () => {
  console.log(sum(1, 2))
}`,
      "javascript",
    ],
    [
      "detects Python",
      `from pathlib import Path

def load_file(name):
    return Path(name).read_text()`,
      "python",
    ],
    [
      "detects Go",
      `package main

import "fmt"

func main() {
  fmt.Println("hi")
}`,
      "go",
    ],
    [
      "detects Rust",
      `use std::fmt;

fn main() {
  let value = 1;
  match value {
    _ => {}
  }
}`,
      "rust",
    ],
    [
      "detects Java instead of HTML for Javadoc tags",
      `package com.jialelian.backend.service.b.impl;

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
}`,
      "java",
    ],
    [
      "detects HTML",
      `<!DOCTYPE html>
<html>
  <body>
    <div class="app"><p>Hello</p></div>
  </body>
</html>`,
      "html",
    ],
    [
      "detects CSS",
      `.card {
  color: #111;
  padding: 12px;
}

@media (max-width: 800px) {
  .card {
    padding: 8px;
  }
}`,
      "css",
    ],
    [
      "detects JSON",
      `{
  "name": "diff",
  "private": true
}`,
      "json",
    ],
    [
      "detects YAML",
      `---
name: diff
version: 1`,
      "yaml",
    ],
    [
      "detects Markdown",
      `# Title

- one
- two

> quote`,
      "markdown",
    ],
    [
      "detects shell scripts",
      `#!/usr/bin/env bash
export NODE_ENV=production
if [ -f .env ]; then
  echo ok
fi`,
      "shellscript",
    ],
    [
      "detects JSX without TypeScript annotations",
      `export function App() {
  return <main><Button label={label} /></main>
}`,
      "jsx",
    ],
    [
      "detects plain HTML instead of JSX",
      `<section>
  <h1>Hello</h1>
  <p>World</p>
</section>`,
      "html",
    ],
    [
      "detects C",
      `#include <stdio.h>

int main() {
  printf("hello\\n");
  return 0;
}`,
      "c",
    ],
    [
      "detects C++",
      `#include <iostream>
#include <vector>

class Greeter {
public:
  void run() {
    std::cout << "hi" << std::endl;
  }
};`,
      "cpp",
    ],
    [
      "detects C#",
      `using System;

namespace DemoApp;

public class User {
  public string Name { get; set; } = string.Empty;
}`,
      "csharp",
    ],
    [
      "detects Java with package and imports",
      `package com.example.demo;

import java.util.List;

public class UserService {
  public List<String> list() {
    return List.of();
  }
}`,
      "java",
    ],
    [
      "detects markdown code fences as markdown",
      `# API Notes

\`\`\`ts
const value: string = 'ok'
\`\`\``,
      "markdown",
    ],
    [
      "detects shell snippets without shebang",
      `export NODE_ENV=production
if [ -n "$HOME" ]; then
  echo ready
fi`,
      "shellscript",
    ],
    [
      "detects SQL join queries",
      `SELECT u.id, p.name
FROM users u
JOIN profiles p ON p.user_id = u.id
WHERE u.active = true;`,
      "sql",
    ],
  ])('%s', (_name, source, language) => {
    expect(detectLanguage(source)).toBe(language)
  })
})

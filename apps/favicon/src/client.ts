document.addEventListener('DOMContentLoaded', () => {
  const preview = document.querySelector<HTMLImageElement>('[data-preview]')
  const urlInput = document.querySelector<HTMLInputElement>('[data-url]')
  const snippet = document.querySelector<HTMLElement>('[data-snippet]')
  const copyBtn = document.querySelector<HTMLButtonElement>('[data-copy]')
  const copyStatus = document.querySelector<HTMLElement>('[data-copy-status]')
  const resetBtn = document.querySelector<HTMLButtonElement>('[data-reset]')
  const textControls = document.querySelector<HTMLElement>('[data-text-controls]')
  const iconControls = document.querySelector<HTMLElement>('[data-icon-controls]')
  const modeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode-btn]'))
  const bgModeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-bg-mode-btn]'))
  const bg2Control = document.querySelector<HTMLElement>('[data-bg2-control]')
  const angleControl = document.querySelector<HTMLElement>('[data-angle-control]')
  const sizeLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-size-link]'))
  const sizePreviews = Array.from(document.querySelectorAll<HTMLElement>('[data-size-preview]'))

  if (!preview || !urlInput || !snippet) return

  const fields = {
    text: document.querySelector<HTMLInputElement>('[data-field="text"]'),
    icon: document.querySelector<HTMLSelectElement>('[data-field="icon"]'),
    fg: document.querySelector<HTMLInputElement>('[data-field="fg"]'),
    fgText: document.querySelector<HTMLInputElement>('[data-field="fgText"]'),
    bg1: document.querySelector<HTMLInputElement>('[data-field="bg1"]'),
    bg1Text: document.querySelector<HTMLInputElement>('[data-field="bg1Text"]'),
    bg2: document.querySelector<HTMLInputElement>('[data-field="bg2"]'),
    bg2Text: document.querySelector<HTMLInputElement>('[data-field="bg2Text"]'),
    angle: document.querySelector<HTMLInputElement>('[data-field="angle"]'),
    size: document.querySelector<HTMLInputElement>('[data-field="size"]'),
    glyphInputs: Array.from(document.querySelectorAll<HTMLInputElement>('[data-field="glyph"]')),
  }

  const valueLabels = {
    angle: Array.from(document.querySelectorAll<HTMLElement>('[data-field-value="angle"]')),
    size: Array.from(document.querySelectorAll<HTMLElement>('[data-field-value="size"]')),
    glyph: Array.from(document.querySelectorAll<HTMLElement>('[data-field-value="glyph"]')),
  }

  const defaults = {
    type: 'text',
    bgMode: 'gradient',
    text: fields.text?.value || 'TF',
    icon: fields.icon?.value || 'sparkles',
    fg: fields.fg?.value || '#f8fafc',
    bg1: fields.bg1?.value || '#111827',
    bg2: fields.bg2?.value || '#6366f1',
    angle: Number(fields.angle?.value || 140),
    size: Number(fields.size?.value || 128),
    glyph: Number(fields.glyphInputs[0]?.value || 64),
  }

  const state = { ...defaults }

  const normalizeHex = (value: string) => {
    const trimmed = value.trim()
    return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : null
  }

  const syncColorText = (source: HTMLInputElement | null, target: HTMLInputElement | null) => {
    if (!source || !target) return
    const next = normalizeHex(source.value)
    if (next) {
      target.value = next
    }
  }

  const setActiveMode = (mode: string) => {
    state.type = mode === 'icon' ? 'icon' : 'text'
    modeButtons.forEach((btn) => {
      const isActive = btn.dataset.modeValue === state.type
      btn.classList.toggle('is-active', isActive)
    })
    if (textControls) textControls.classList.toggle('is-hidden', state.type !== 'text')
    if (iconControls) iconControls.classList.toggle('is-hidden', state.type !== 'icon')
  }

  const setBackgroundMode = (mode: string) => {
    state.bgMode = mode === 'solid' ? 'solid' : 'gradient'
    bgModeButtons.forEach((btn) => {
      const isActive = btn.dataset.bgModeValue === state.bgMode
      btn.classList.toggle('is-active', isActive)
    })
    const isSolid = state.bgMode === 'solid'
    if (bg2Control) bg2Control.classList.toggle('is-disabled', isSolid)
    if (angleControl) angleControl.classList.toggle('is-disabled', isSolid)
    if (fields.bg2) fields.bg2.disabled = isSolid
    if (fields.bg2Text) fields.bg2Text.disabled = isSolid
    if (fields.angle) fields.angle.disabled = isSolid
  }

  const buildQuery = () => {
    const params = new URLSearchParams()
    params.set('type', state.type)
    params.set('fg', state.fg)
    params.set('bg1', state.bg1)
    if (state.bgMode !== 'solid') {
      params.set('bg2', state.bg2)
    }
    params.set('angle', String(state.angle))
    params.set('glyph', String(state.glyph))
    if (state.type === 'text') {
      params.set('text', state.text)
    } else {
      params.set('icon', state.icon)
    }
    return params
  }

  const buildUrl = (size: number) => {
    const params = buildQuery()
    return `/icon/${size}?${params.toString()}`
  }

  const updateSnippet = (baseUrl: string) => {
    const lines = [
      `<link rel="icon" type="image/svg+xml" href="${baseUrl}/icon/32?${buildQuery().toString()}" sizes="32x32">`,
      `<link rel="icon" type="image/svg+xml" href="${baseUrl}/icon/16?${buildQuery().toString()}" sizes="16x16">`,
      `<link rel="icon" type="image/svg+xml" href="${baseUrl}/icon/64?${buildQuery().toString()}" sizes="64x64">`,
    ]
    snippet.textContent = lines.join('\n')
  }

  const updatePreview = () => {
    const previewSize = 256
    preview.src = buildUrl(previewSize)

    const absoluteBase = window.location.origin
    const url = `${absoluteBase}${buildUrl(state.size)}`
    urlInput.value = url

    sizeLinks.forEach((link) => {
      const size = Number(link.dataset.size || 0)
      if (!size) return
      link.href = `${absoluteBase}${buildUrl(size)}`
    })

    sizePreviews.forEach((item) => {
      const size = Number(item.dataset.size || 0)
      const img = item.querySelector('img')
      if (!size || !img) return
      img.src = buildUrl(size)
    })

    updateSnippet(absoluteBase)
  }

  const updateLabels = () => {
    valueLabels.angle.forEach((label) => {
      label.textContent = `${state.angle}°`
    })
    valueLabels.size.forEach((label) => {
      label.textContent = `${state.size}px`
    })
    valueLabels.glyph.forEach((label) => {
      label.textContent = `${state.glyph}%`
    })
  }

  const applyState = () => {
    updateLabels()
    updatePreview()
  }

  const resetToDefaults = () => {
    state.type = defaults.type
    state.bgMode = defaults.bgMode
    state.text = defaults.text
    state.icon = defaults.icon
    state.fg = defaults.fg
    state.bg1 = defaults.bg1
    state.bg2 = defaults.bg2
    state.angle = defaults.angle
    state.size = defaults.size
    state.glyph = defaults.glyph

    setActiveMode(state.type)
    setBackgroundMode(state.bgMode)

    if (fields.text) fields.text.value = state.text
    if (fields.icon) fields.icon.value = state.icon
    if (fields.fg) fields.fg.value = state.fg
    if (fields.fgText) fields.fgText.value = state.fg
    if (fields.bg1) fields.bg1.value = state.bg1
    if (fields.bg1Text) fields.bg1Text.value = state.bg1
    if (fields.bg2) fields.bg2.value = state.bg2
    if (fields.bg2Text) fields.bg2Text.value = state.bg2
    if (fields.angle) fields.angle.value = String(state.angle)
    if (fields.size) fields.size.value = String(state.size)
    fields.glyphInputs.forEach((glyphInput) => {
      glyphInput.value = String(state.glyph)
    })

    applyState()
  }

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveMode(btn.dataset.modeValue || 'text')
      applyState()
    })
  })

  bgModeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setBackgroundMode(btn.dataset.bgModeValue || 'gradient')
      applyState()
    })
  })

  if (fields.text) {
    let isComposing = false

    fields.text.addEventListener('compositionstart', () => {
      isComposing = true
    })

    fields.text.addEventListener('compositionend', () => {
      isComposing = false
      if (!fields.text) return;
      const value = fields.text.value.replace(/\s+/g, '').slice(0, 6)
      state.text = value || 'TF'
      fields.text.value = value
      applyState()
    })

    fields.text.addEventListener('input', (event) => {
      if (isComposing) return
      const value = (event.target as HTMLInputElement).value.replace(/\s+/g, '').slice(0, 6)
      state.text = value || 'TF'
      if (fields.text) {
        fields.text.value = value
      }
      applyState()
    })
  }

  fields.icon?.addEventListener('change', (event) => {
    state.icon = (event.target as HTMLSelectElement).value
    applyState()
  })

  fields.glyphInputs.forEach((input) => {
    input.addEventListener('input', (event) => {
      state.glyph = Number((event.target as HTMLInputElement).value)
      fields.glyphInputs.forEach((glyphInput) => {
        if (glyphInput !== event.target) glyphInput.value = String(state.glyph)
      })
      applyState()
    })
  })

  fields.angle?.addEventListener('input', (event) => {
    state.angle = Number((event.target as HTMLInputElement).value)
    applyState()
  })

  fields.size?.addEventListener('input', (event) => {
    state.size = Number((event.target as HTMLInputElement).value)
    applyState()
  })

  fields.fg?.addEventListener('input', () => {
    state.fg = fields.fg?.value || state.fg
    syncColorText(fields.fg, fields.fgText)
    applyState()
  })

  fields.fgText?.addEventListener('change', () => {
    const next = normalizeHex(fields.fgText?.value || '')
    if (!next || !fields.fg) return
    fields.fg.value = next
    state.fg = next
    applyState()
  })

  fields.bg1?.addEventListener('input', () => {
    state.bg1 = fields.bg1?.value || state.bg1
    syncColorText(fields.bg1, fields.bg1Text)
    applyState()
  })

  fields.bg1Text?.addEventListener('change', () => {
    const next = normalizeHex(fields.bg1Text?.value || '')
    if (!next || !fields.bg1) return
    fields.bg1.value = next
    state.bg1 = next
    applyState()
  })

  fields.bg2?.addEventListener('input', () => {
    if (state.bgMode === 'solid') return
    state.bg2 = fields.bg2?.value || state.bg2
    syncColorText(fields.bg2, fields.bg2Text)
    applyState()
  })

  fields.bg2Text?.addEventListener('change', () => {
    if (state.bgMode === 'solid') return
    const next = normalizeHex(fields.bg2Text?.value || '')
    if (!next || !fields.bg2) return
    fields.bg2.value = next
    state.bg2 = next
    applyState()
  })

  if (copyBtn && copyStatus) {
    let timer: number | null = null

    const setStatus = (text: string) => {
      copyStatus.textContent = text
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        copyStatus.textContent = 'Copy'
      }, 1600)
    }

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(urlInput.value)
        setStatus('Copied!')
      } catch (err) {
        console.error(err)
        setStatus('Copy failed')
      }
    })
  }

  sizeLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault()
      window.open(link.href, '_blank')
    })
  })

  resetBtn?.addEventListener('click', () => {
    resetToDefaults()
  })

  setActiveMode(state.type)
  setBackgroundMode(state.bgMode)
  applyState()
})

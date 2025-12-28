import { DEFAULTS, PRESETS } from './config'
import { buildIconPreviewSvg, ICON_SETS } from './icon-registry'
import { IconVirtualList } from './icon-virtual-list'

document.addEventListener('DOMContentLoaded', () => {
  const preview = document.querySelector<HTMLImageElement>('[data-preview]')
  const previewCanvas = document.querySelector<HTMLElement>('[data-preview-canvas]')
  const urlInput = document.querySelector<HTMLInputElement>('[data-url]')
  const snippetList = document.querySelector<HTMLElement>('[data-snippet-list]')
  const copyBtn = document.querySelector<HTMLButtonElement>('[data-copy]')
  const iconFilter = document.querySelector<HTMLInputElement>('[data-icon-filter]')
  const textControls = document.querySelector<HTMLElement>('[data-text-controls]')
  const iconControls = document.querySelector<HTMLElement>('[data-icon-controls]')
  const iconDropdown = document.querySelector<HTMLElement>('[data-icon-dropdown]')
  const iconTrigger = document.querySelector<HTMLButtonElement>('[data-icon-trigger]')
  const iconMenu = document.querySelector<HTMLElement>('[data-icon-menu]')
  const iconOptionsContainer = document.querySelector<HTMLElement>('[data-icon-options]')
  const iconLabel = document.querySelector<HTMLElement>('[data-icon-label]')
  const iconTriggerPreview = document.querySelector<HTMLElement>('[data-icon-trigger-preview]')
  const modeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode-btn]'))
  const bgModeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-bg-mode-btn]'))
  const presetButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-preset]'))
  const randomBtn = document.querySelector<HTMLButtonElement>('[data-random]')
  const bg1Control = document.querySelector<HTMLElement>('[data-bg1-control]')
  const bg2Control = document.querySelector<HTMLElement>('[data-bg2-control]')
  const angleControl = document.querySelector<HTMLElement>('[data-angle-control]')
  const sizeLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-size-link]'))
  const sizeDownloads = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-size-download]'))
  const formatButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-format-btn]'))

  if (!preview || !urlInput || !snippetList) return

  const fields = {
    text: document.querySelector<HTMLInputElement>('[data-field="text"]'),
    icon: document.querySelector<HTMLInputElement>('[data-field="icon"]'),
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

  const initialBg1 = fields.bg1?.value || DEFAULTS.bg1
  const initialBg2 = fields.bg2?.value || DEFAULTS.bg2

  const defaults = {
    type: 'text',
    bgMode: initialBg1 === initialBg2 ? 'solid' : 'gradient',
    text: fields.text?.value || DEFAULTS.text,
    icon: fields.icon?.value || DEFAULTS.icon,
    fg: fields.fg?.value || DEFAULTS.fg,
    bg1: initialBg1,
    bg2: initialBg2,
    angle: Number(fields.angle?.value || DEFAULTS.angle),
    size: Number(fields.size?.value || DEFAULTS.size),
    glyph: Number(fields.glyphInputs[0]?.value || DEFAULTS.glyph),
  }

  const state = {
    ...defaults,
    iconLucide: fields.icon?.value || DEFAULTS.icon,
    iconTabler: ICON_SETS.tabler.defaultIcon || DEFAULTS.icon,
    iconLogos: ICON_SETS.logos.defaultIcon || DEFAULTS.icon,
  }

  let downloadFormat: 'svg' | 'png' | 'jpeg' | 'webp' = 'svg'

  const presets = PRESETS

  const normalizeHex = (value: string) => {
    const trimmed = value.trim()
    return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed.toLowerCase() : null
  }

  const hslToHex = (h: number, s: number, l: number) => {
    const sat = s / 100
    const light = l / 100
    const c = (1 - Math.abs(2 * light - 1)) * sat
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = light - c / 2
    let r = 0
    let g = 0
    let b = 0

    if (h >= 0 && h < 60) {
      r = c
      g = x
    } else if (h >= 60 && h < 120) {
      r = x
      g = c
    } else if (h >= 120 && h < 180) {
      g = c
      b = x
    } else if (h >= 180 && h < 240) {
      g = x
      b = c
    } else if (h >= 240 && h < 300) {
      r = x
      b = c
    } else {
      r = c
      b = x
    }

    const toHex = (value: number) => {
      const channel = Math.round((value + m) * 255)
      return channel.toString(16).padStart(2, '0')
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  const hexToRgb = (hex: string) => {
    const normalized = normalizeHex(hex)
    if (!normalized) return null
    const value = normalized.slice(1)
    const r = parseInt(value.slice(0, 2), 16)
    const g = parseInt(value.slice(2, 4), 16)
    const b = parseInt(value.slice(4, 6), 16)
    return { r, g, b }
  }

  const getLuminance = (hex: string) => {
    const rgb = hexToRgb(hex)
    if (!rgb) return 0
    const transform = (value: number) => {
      const channel = value / 255
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)
    }
    const r = transform(rgb.r)
    const g = transform(rgb.g)
    const b = transform(rgb.b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  const syncColorText = (source: HTMLInputElement | null, target: HTMLInputElement | null) => {
    if (!source || !target) return
    const next = normalizeHex(source.value)
    if (next) {
      target.value = next
    }
  }

  const getIconSet = (mode: string) => (mode === 'tabler' ? 'tabler' : mode === 'logos' ? 'logos' : 'lucide')

  const setActiveMode = (mode: string) => {
    state.type = mode === 'lucide' || mode === 'tabler' || mode === 'logos' ? mode : 'text'
    modeButtons.forEach((btn) => {
      const isActive = btn.dataset.modeValue === state.type
      btn.classList.toggle('is-active', isActive)
    })
    if (textControls) textControls.classList.toggle('is-hidden', state.type !== 'text')
    if (iconControls) iconControls.classList.toggle('is-hidden', state.type === 'text')
    if (state.type !== 'text') {
      state.icon = state.type === 'tabler' ? state.iconTabler : state.type === 'logos' ? state.iconLogos : state.iconLucide
      if (fields.icon) fields.icon.value = state.icon
    }
  }

  let prevFg = state.fg
  let didOverrideFg = false

  const setBackgroundMode = (mode: string) => {
    const nextMode = mode === 'solid' ? 'solid' : mode === 'transparent' ? 'transparent' : 'gradient'
    const prevMode = state.bgMode
    state.bgMode = nextMode
    bgModeButtons.forEach((btn) => {
      const isActive = btn.dataset.bgModeValue === state.bgMode
      btn.classList.toggle('is-active', isActive)
    })
    const isSolid = state.bgMode === 'solid'
    const isTransparent = state.bgMode === 'transparent'
    if (nextMode === 'transparent' && prevMode !== 'transparent') {
      prevFg = state.fg
      didOverrideFg = false
      const luminance = getLuminance(state.fg)
      if (luminance > 0.72) {
        const nextFg = '#0f172a'
        state.fg = nextFg
        didOverrideFg = true
        if (fields.fg) fields.fg.value = nextFg
        if (fields.fgText) fields.fgText.value = nextFg
      }
    } else if (prevMode === 'transparent' && nextMode !== 'transparent' && didOverrideFg) {
      state.fg = prevFg
      if (fields.fg) fields.fg.value = prevFg
      if (fields.fgText) fields.fgText.value = prevFg
    }
    if (bg1Control) bg1Control.classList.toggle('is-disabled', isTransparent)
    if (bg2Control) bg2Control.classList.toggle('is-disabled', isSolid || isTransparent)
    if (angleControl) angleControl.classList.toggle('is-disabled', isSolid || isTransparent)
    if (fields.bg1) fields.bg1.disabled = isTransparent
    if (fields.bg1Text) fields.bg1Text.disabled = isTransparent
    if (fields.bg2) fields.bg2.disabled = isSolid || isTransparent
    if (fields.bg2Text) fields.bg2Text.disabled = isSolid || isTransparent
    if (fields.angle) fields.angle.disabled = isSolid || isTransparent
  }

  const updateIconSearchPlaceholder = () => {
    if (!iconFilter) return
    const label = ICON_SETS[getIconSet(state.type)]?.label || 'Icon'
    iconFilter.placeholder = `Search ${label.toLowerCase()} icons`
  }

  const filterIconOptions = () => {
    const query = iconFilter?.value.trim().toLowerCase() || ''
    resetIconOptions(query)
  }

  const syncIconSet = () => {
    const iconSet = getIconSet(state.type)
    const fallbackIcon = ICON_SETS[iconSet]?.defaultIcon || DEFAULTS.icon
    const currentIcon =
      iconSet === 'tabler' ? state.iconTabler : iconSet === 'logos' ? state.iconLogos : state.iconLucide
    const nextIcon = ICON_SETS[iconSet]?.names.includes(currentIcon) ? currentIcon : fallbackIcon
    if (iconSet === 'tabler') {
      state.iconTabler = nextIcon
    } else if (iconSet === 'logos') {
      state.iconLogos = nextIcon
    } else {
      state.iconLucide = nextIcon
    }
    state.icon = nextIcon
    if (fields.icon) fields.icon.value = nextIcon
    if (iconMenu && !iconMenu.classList.contains('is-hidden')) {
      resetIconOptions(iconFilter?.value.trim().toLowerCase() || '')
      scrollToSelected()
    } else {
      clearIconOptions()
    }
    updateIconSearchPlaceholder()
    setIconSelection(state.icon)
  }

  const buildQuery = () => {
    const params = new URLSearchParams()
    params.set('type', state.type)
    params.set('fg', state.fg)
    params.set('bg', state.bgMode)
    if (state.bgMode !== 'transparent') {
      params.set('bg1', state.bg1)
    }
    if (state.bgMode === 'gradient') {
      params.set('bg2', state.bg2)
      params.set('angle', String(state.angle))
    }
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

  const downloadRaster = async (size: number, format: 'png' | 'jpeg' | 'webp') => {
    const svgUrl = buildUrl(size)
    try {
      const response = await fetch(svgUrl)
      const svgText = await response.text()
      const normalizedSvgText =
        format === 'jpeg' ? svgText.replace(/rx="[^"]*"/g, 'rx="0"') : svgText
      const svgBlob = new Blob([normalizedSvgText], { type: 'image/svg+xml' })
      const svgObjectUrl = URL.createObjectURL(svgBlob)

      const img = new Image()
      img.decoding = 'async'
      img.src = svgObjectUrl
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load SVG'))
      })

      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      if (format === 'jpeg' && state.bgMode === 'transparent') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
      }
      ctx.drawImage(img, 0, 0, size, size)
      URL.revokeObjectURL(svgObjectUrl)

      const dataUrl = canvas.toDataURL(`image/${format}`, 0.92)
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `icon-${size}.${format}`
      link.click()
    } catch (err) {
      console.error(err)
    }
  }

  const buildIconSvg = (iconSet: string, name: string, color: string, size: number) => {
    const resolved = iconSet === 'tabler' ? 'tabler' : iconSet === 'logos' ? 'logos' : 'lucide'
    return buildIconPreviewSvg(resolved, name, color, size)
  }

  const renderIconPreview = (target: HTMLElement, iconSet: string, name: string, color: string, size: number) => {
    target.innerHTML = buildIconSvg(iconSet, name, color, size)
  }

  const iconResults: string[] = []
  const iconRowHeight = iconOptionsContainer
    ? Number.parseFloat(getComputedStyle(iconOptionsContainer).getPropertyValue('--icon-row')) || 46
    : 46

  const createIconOption = (name: string, iconSet: string) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'icon-option'
    button.dataset.iconOption = 'true'
    button.dataset.iconName = name
    button.dataset.iconSet = iconSet
    if (name === state.icon && iconSet === getIconSet(state.type)) {
      button.classList.add('is-selected')
    }

    const previewWrap = document.createElement('span')
    previewWrap.className = 'icon-option__preview'
    previewWrap.setAttribute('aria-hidden', 'true')

    const preview = document.createElement('span')
    preview.dataset.iconPreview = 'true'
    preview.dataset.iconName = name
    preview.dataset.iconSet = iconSet
    preview.innerHTML = buildIconSvg(iconSet, name, '#111827', 20)
    previewWrap.append(preview)

    const label = document.createElement('span')
    label.className = 'icon-option__name'
    label.textContent = name

    button.append(previewWrap, label)
    return button
  }

  const iconVirtualList =
    iconOptionsContainer
      ? new IconVirtualList({
          container: iconOptionsContainer,
          rowHeight: iconRowHeight,
          overscan: 8,
          renderRow: (name, iconSet) => createIconOption(name, iconSet),
        })
      : null

  const resetIconOptions = (query: string) => {
    if (!iconVirtualList) return
    const iconSet = getIconSet(state.type)
    const names = ICON_SETS[iconSet]?.names || []
    const results = query ? names.filter((name) => name.includes(query)) : names
    iconResults.length = 0
    iconResults.push(...results)
    iconVirtualList.setItems(iconResults, iconSet)
  }

  const clearIconOptions = () => {
    if (!iconVirtualList) return
    iconResults.length = 0
    iconVirtualList.clear()
  }

  const scrollToSelected = () => {
    if (!iconVirtualList) return
    if (state.type === 'text') return
    iconVirtualList.scrollToName(state.icon)
  }

  const updateIconPreview = () => {
    if (!iconTriggerPreview) return
    renderIconPreview(iconTriggerPreview, getIconSet(state.type), state.icon, '#111827', 20)
    if (iconLabel) iconLabel.textContent = state.icon
  }

  const updateSnippet = (baseUrl: string) => {
    const size = state.size
    const iconUrl = `${baseUrl}${buildUrl(size)}`
    const query = buildQuery().toString()
    const groups = [
      {
        title: 'Icon usage',
        lines: [
          `<img src="${iconUrl}" alt="Icon" width="${size}" height="${size}" />`,
          `<div class="brand-icon" style="background-image: url('${iconUrl}'); width: ${size}px; height: ${size}px;"></div>`,
        ],
      },
      {
        title: 'Favicon',
        lines: [
          `<link rel="icon" sizes="16x16" type="image/svg+xml" href="${baseUrl}/icon/16?${query}" />`,
          `<link rel="icon" sizes="32x32" type="image/svg+xml" href="${baseUrl}/icon/32?${query}" />`,
          `<link rel="icon" sizes="64x64" type="image/svg+xml" href="${baseUrl}/icon/64?${query}" />`,
        ],
      },
    ]

    snippetList.innerHTML = ''
    groups.forEach((group) => {
      const groupWrap = document.createElement('div')
      groupWrap.className = 'snippet-group'
      const title = document.createElement('p')
      title.className = 'snippet-group__title'
      title.textContent = group.title
      groupWrap.append(title)
      group.lines.forEach((line) => {
        const row = document.createElement('div')
        row.className = 'snippet-row'
        const code = document.createElement('code')
        code.textContent = line
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'snippet-copy'
        button.dataset.snippetCopy = 'true'
        button.textContent = 'Copy'
        row.append(code, button)
        groupWrap.append(row)
      })
      snippetList.append(groupWrap)
    })
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
      const isSelected = size === state.size
      link.classList.toggle('is-selected', isSelected)
      link.closest<HTMLElement>('.chip-group')?.classList.toggle('is-selected', isSelected)
    })

    sizeDownloads.forEach((link) => {
      const size = Number(link.dataset.size || 0)
      if (!size) return
      link.href = `${absoluteBase}${buildUrl(size)}`
      link.setAttribute('title', `Download ${size}px ${downloadFormat.toUpperCase()}`)
      link.setAttribute('aria-label', `Download ${size}px ${downloadFormat.toUpperCase()}`)
      if (downloadFormat === 'svg') {
        link.setAttribute('download', `icon-${size}.svg`)
      } else {
        link.removeAttribute('download')
      }
    })

    updateSnippet(absoluteBase)
  }

  const handlePreviewLoad = () => {
    previewCanvas?.classList.remove('is-loading')
  }

  preview.addEventListener('load', handlePreviewLoad)
  if (preview.complete && preview.naturalWidth > 0) {
    handlePreviewLoad()
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

  const debounce = <T extends (...args: unknown[]) => void>(fn: T, wait = 120) => {
    let timer: number | null = null
    return (...args: Parameters<T>) => {
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        fn(...args)
      }, wait)
    }
  }

  const scheduleRender = debounce(() => {
    updatePreview()
    updateIconPreview()
  }, 220)

  const applyState = () => {
    updateLabels()
    scheduleRender()
  }

  const applyStateImmediate = () => {
    updateLabels()
    updatePreview()
    updateIconPreview()
  }

  const applyPalette = (palette: { bgMode: string; fg: string; bg1: string; bg2: string; angle: number }) => {
    state.bgMode = palette.bgMode === 'solid' ? 'solid' : 'gradient'
    state.fg = palette.fg
    state.bg1 = palette.bg1
    state.bg2 = palette.bg2
    state.angle = palette.angle

    setBackgroundMode(state.bgMode)

    if (fields.fg) fields.fg.value = state.fg
    if (fields.fgText) fields.fgText.value = state.fg
    if (fields.bg1) fields.bg1.value = state.bg1
    if (fields.bg1Text) fields.bg1Text.value = state.bg1
    if (fields.bg2) fields.bg2.value = state.bg2
    if (fields.bg2Text) fields.bg2Text.value = state.bg2
    if (fields.angle) fields.angle.value = String(state.angle)

    applyStateImmediate()
  }

  const applyRandomPalette = () => {
    const baseHue = Math.floor(Math.random() * 360)
    const hueShift = 40 + Math.random() * 120
    const sat = 55 + Math.random() * 25
    const light = 38 + Math.random() * 22
    const bg1 = hslToHex(baseHue, sat, light)
    const bg2 = hslToHex((baseHue + hueShift) % 360, sat, light)
    const fg = getLuminance(bg1) > 0.55 ? '#0f172a' : '#f8fafc'
    const nextBgMode = state.bgMode
    applyPalette({
      bgMode: nextBgMode,
      fg,
      bg1,
      bg2: nextBgMode === 'solid' ? bg1 : bg2,
      angle: Math.floor(Math.random() * 361),
    })
  }


  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveMode(btn.dataset.modeValue || 'text')
      if (state.type !== 'text') {
        syncIconSet()
      }
      applyStateImmediate()
    })
  })


  bgModeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setBackgroundMode(btn.dataset.bgModeValue || 'gradient')
      applyStateImmediate()
    })
  })

  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const index = Number(btn.dataset.preset || 0)
      const preset = presets[index]
      if (!preset) return
      applyPalette(preset)
    })
  })

  randomBtn?.addEventListener('click', () => {
    applyRandomPalette()
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

  const setIconSelection = (name: string) => {
    state.icon = name
    if (fields.icon) fields.icon.value = name
    if (getIconSet(state.type) === 'tabler') {
      state.iconTabler = name
    } else if (getIconSet(state.type) === 'logos') {
      state.iconLogos = name
    } else {
      state.iconLucide = name
    }
    if (iconOptionsContainer) {
      Array.from(iconOptionsContainer.querySelectorAll<HTMLButtonElement>('[data-icon-option]')).forEach((option) => {
        const isMatch = option.dataset.iconName === name && option.dataset.iconSet === getIconSet(state.type)
        option.classList.toggle('is-selected', isMatch)
      })
    }
    applyStateImmediate()
  }

  const openIconMenu = () => {
    if (!iconMenu || !iconDropdown) return
    iconMenu.classList.remove('is-hidden')
    iconDropdown.classList.add('is-open')
    iconFilter?.focus()
    resetIconOptions(iconFilter?.value.trim().toLowerCase() || '')
    scrollToSelected()
  }

  const closeIconMenu = () => {
    if (!iconMenu || !iconDropdown) return
    iconMenu.classList.add('is-hidden')
    iconDropdown.classList.remove('is-open')
    if (iconFilter) iconFilter.value = ''
    clearIconOptions()
  }

  iconTrigger?.addEventListener('click', () => {
    if (!iconMenu || !iconDropdown) return
    const isOpen = !iconMenu.classList.contains('is-hidden')
    if (isOpen) {
      closeIconMenu()
    } else {
      openIconMenu()
    }
  })

  iconOptionsContainer?.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null
    if (!target) return
    const option = target.closest<HTMLButtonElement>('[data-icon-option]')
    if (!option) return
    const name = option.dataset.iconName
    const iconSet = option.dataset.iconSet
    if (!name || iconSet !== getIconSet(state.type)) return
    setIconSelection(name)
    if (iconFilter) iconFilter.value = ''
    filterIconOptions()
    closeIconMenu()
  })

  if (iconFilter) {
    iconFilter.addEventListener('input', () => {
      filterIconOptions()
    })

    iconFilter.addEventListener('focus', () => {
      openIconMenu()
    })
  }

  document.addEventListener('click', (event) => {
    if (!iconDropdown) return
    if (!iconDropdown.contains(event.target as Node)) closeIconMenu()
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

  if (copyBtn) {
    let timer: number | null = null
    const resetCopyText = () => {
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        copyBtn.textContent = 'Copy'
      }, 1200)
    }

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(urlInput.value)
        copyBtn.textContent = 'Copied'
        resetCopyText()
      } catch (err) {
        console.error(err)
        copyBtn.textContent = 'Failed'
        resetCopyText()
      }
    })
  }

  snippetList.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement | null
    if (!target || !(target instanceof HTMLButtonElement)) return
    if (!target.dataset.snippetCopy) return
    const row = target.closest('.snippet-row')
    const code = row?.querySelector('code')
    const text = code?.textContent
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      target.textContent = 'Copied'
      window.setTimeout(() => {
        if (target) target.textContent = 'Copy'
      }, 1200)
    } catch (err) {
      console.error(err)
      target.textContent = 'Failed'
      window.setTimeout(() => {
        if (target) target.textContent = 'Copy'
      }, 1200)
    }
  })

  sizeLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault()
      const size = Number(link.dataset.size || 0)
      if (!size) return
      state.size = size
      if (fields.size) fields.size.value = String(size)
      applyStateImmediate()
    })
  })

  sizeDownloads.forEach((link) => {
    link.addEventListener('click', async (event) => {
      if (downloadFormat === 'svg') return
      event.preventDefault()
      const size = Number(link.dataset.size || 0)
      if (!size) return
      await downloadRaster(size, downloadFormat)
    })
  })

  formatButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format
      if (format !== 'svg' && format !== 'png' && format !== 'jpeg' && format !== 'webp') return
      downloadFormat = format
      formatButtons.forEach((item) => {
        item.classList.toggle('is-active', item.dataset.format === downloadFormat)
      })
      applyStateImmediate()
    })
  })

  setActiveMode(state.type)
  setBackgroundMode(state.bgMode)
  syncIconSet()
})

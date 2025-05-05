const typeColors: { [key: string]: { color_on: string; color_off: string } } = {}

const lightenColor = (hex: string, factor: number = 0.2): string => {
  let color = hex.replace('#', '')
  if (color.length === 3) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2]
  }

  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)

  const lightenedR = Math.min(255, Math.round(r + (255 - r) * factor))
  const lightenedG = Math.min(255, Math.round(g + (255 - g) * factor))
  const lightenedB = Math.min(255, Math.round(b + (255 - b) * factor))

  const toHex = (c: number): string => {
    const hex = c.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(lightenedR)}${toHex(lightenedG)}${toHex(lightenedB)}`
}

const darkenColor = (hex: string, factor: number = 0.2): string => {
  let color = hex.replace('#', '')
  if (color.length === 3) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2]
  }

  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)

  const darkenedR = Math.max(0, Math.round(r - r * factor))
  const darkenedG = Math.max(0, Math.round(g - g * factor))
  const darkenedB = Math.max(0, Math.round(b - b * factor))

  const toHex = (c: number): string => {
    const hex = c.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(darkenedR)}${toHex(darkenedG)}${toHex(darkenedB)}`
}

const baseColors: { [key: string]: string } = {}

const distinctColors = [
  '#c74671',
  '#73d64e',
  '#713fc9',
  '#d0d34a',
  '#cb4ebf',
  '#77db9e',
  '#552d75',
  '#678935',
  '#7678d4',
  '#c78b39',
  '#5c769c',
  '#d64e34',
  '#86c9d8',
  '#783928',
  '#cfcf9d',
  '#46283e',
  '#589077',
  '#cd9bc7',
  '#3b492d',
  '#bb8978'
]

const generateColor = (type: string) => {
  // 根据类型字符串计算哈希值，并用哈希值从颜色表中选择一个颜色
  let hash = 0
  for (let i = 0; i < type.length; i++) {
    hash = type.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % distinctColors.length
  return distinctColors[index]
}

export const getTypeColor = (type: string, required: boolean = true) => {
  if (typeColors[type]) {
    return typeColors[type]
  }

  let baseColor = baseColors[type]
  if (!baseColor) {
    baseColor = generateColor(type)
    baseColors[type] = baseColor
  }
  const color_on = baseColor
  let color_off = darkenColor(baseColor, 0.2)

  if (!required) {
    color_off = darkenColor(color_off, 0.2) // Further darken if not required
  }

  typeColors[type] = { color_on, color_off }
  return typeColors[type]
}

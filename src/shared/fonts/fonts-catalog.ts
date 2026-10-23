import { TEXT_FONTS, type FontOption } from '../ui/ElementShapes'

// Dynamically discover any TTF, OTF, or WOFF font files placed in assets/fonts/ or public/fonts/
const customFontModules = import.meta.glob(
  [
    '/assets/fonts/*.{ttf,TTF,otf,OTF,woff,woff2}',
    '/public/fonts/*.{ttf,TTF,otf,OTF,woff,woff2}',
  ],
  { eager: true, query: '?url', import: 'default' },
) as Record<string, string>

const loadedFontFaces = new Set<string>()

export function getCustomFonts(): FontOption[] {
  const customFonts: FontOption[] = []
  const seen = new Set<string>()

  for (const [path, url] of Object.entries(customFontModules)) {
    const filename = path.split('/').pop() ?? ''
    const fontName = filename
      .replace(/\.(ttf|otf|woff2?)$/i, '')
      .replace(/[-_]/g, ' ')
      .trim()

    if (!fontName || seen.has(fontName.toLowerCase())) continue
    seen.add(fontName.toLowerCase())

    if (
      typeof document !== 'undefined' &&
      'fonts' in document &&
      !loadedFontFaces.has(fontName)
    ) {
      loadedFontFaces.add(fontName)
      try {
        const fontFace = new FontFace(fontName, `url("${url}")`)
        fontFace
          .load()
          .then((loaded) => {
            document.fonts.add(loaded)
          })
          .catch((err) => {
            console.warn(`Failed to load font ${fontName}:`, err)
          })
      } catch (e) {
        console.warn(`Error registering font ${fontName}:`, e)
      }
    }

    customFonts.push({
      id: fontName,
      label: fontName,
      family: `'${fontName}', 'Noto Sans Myanmar', sans-serif`,
      isCustom: true,
    })
  }

  return customFonts
}

export function getAllAvailableFonts(): FontOption[] {
  return [...TEXT_FONTS, ...getCustomFonts()]
}

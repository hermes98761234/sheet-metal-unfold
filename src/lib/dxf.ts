import type { FlatResult } from './bend'

const f = (n: number) => (Math.round(n * 1e5) / 1e5).toString()

/**
 * Minimal ASCII DXF (R12) of the flat pattern: a CUT outline rectangle and a
 * dashed BEND line per bend across the part width, plus BEND_NOTES text labels.
 * Coordinates are in millimetres; x runs along the profile, y across the width.
 */
export function flatPatternDxf(flat: FlatResult, widthMm: number, labels: string[]): string {
  const L = flat.flatLength
  const W = widthMm
  const out: (string | number)[] = []
  const g = (code: number, value: string | number) => out.push(code, value)
  const line = (layer: string, x1: number, y1: number, x2: number, y2: number) => {
    g(0, 'LINE'); g(8, layer)
    g(10, f(x1)); g(20, f(y1)); g(30, 0)
    g(11, f(x2)); g(21, f(y2)); g(31, 0)
  }
  g(0, 'SECTION'); g(2, 'HEADER')
  g(9, '$ACADVER'); g(1, 'AC1009')
  g(9, '$EXTMIN'); g(10, 0); g(20, 0)
  g(9, '$EXTMAX'); g(10, f(L)); g(20, f(W))
  g(0, 'ENDSEC')
  g(0, 'SECTION'); g(2, 'TABLES')
  g(0, 'TABLE'); g(2, 'LTYPE'); g(70, 2)
  g(0, 'LTYPE'); g(2, 'CONTINUOUS'); g(70, 0); g(3, 'Solid line'); g(72, 65); g(73, 0); g(40, 0)
  g(0, 'LTYPE'); g(2, 'DASHED'); g(70, 0); g(3, 'Dashed'); g(72, 65); g(73, 2); g(40, 9); g(49, 6); g(49, -3)
  g(0, 'ENDTAB')
  g(0, 'TABLE'); g(2, 'LAYER'); g(70, 3)
  g(0, 'LAYER'); g(2, 'CUT'); g(70, 0); g(62, 7); g(6, 'CONTINUOUS')
  g(0, 'LAYER'); g(2, 'BEND'); g(70, 0); g(62, 5); g(6, 'DASHED')
  g(0, 'LAYER'); g(2, 'BEND_NOTES'); g(70, 0); g(62, 3); g(6, 'CONTINUOUS')
  g(0, 'ENDTAB')
  g(0, 'ENDSEC')
  g(0, 'SECTION'); g(2, 'ENTITIES')
  line('CUT', 0, 0, L, 0)
  line('CUT', L, 0, L, W)
  line('CUT', L, W, 0, W)
  line('CUT', 0, W, 0, 0)
  flat.bends.forEach((b, i) => {
    line('BEND', b.lineAt, 0, b.lineAt, W)
    g(0, 'TEXT'); g(8, 'BEND_NOTES')
    g(10, f(b.lineAt + 1)); g(20, f(W + 3)); g(30, 0)
    g(40, f(Math.max(2, W / 25))); g(1, labels[i] ?? `BEND ${i + 1}`)
  })
  g(0, 'ENDSEC')
  g(0, 'EOF')
  const lines: string[] = []
  for (let i = 0; i < out.length; i += 2) lines.push(String(out[i]).padStart(3, ' '), String(out[i + 1]))
  return lines.join('\n') + '\n'
}

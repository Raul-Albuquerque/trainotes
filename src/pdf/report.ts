import { PDFDocument, rgb, StandardFonts, type RGB, type PDFPage } from 'pdf-lib'
import type { LocalWorkoutSession } from '../domain/types'
import { sessionExercisesRepo, sessionSetsRepo } from '../db/repositories/sessions'
import logoUrl from '../assets/logo-black-report.png'

// ── Page geometry (A4 in points: 1pt = 1/72 inch) ─────────────────────────
const PAGE_W = 595.28
const PAGE_H = 841.89
const ML = 56.69   // 20 mm
const MR = 56.69   // 20 mm
const CONTENT_W = PAGE_W - ML - MR

// ── Vertical zones ─────────────────────────────────────────────────────────
const HEADER_H = 28    // space used by per-page header at top
const FOOTER_H = 22    // reserved at bottom for footer
const Y_TOP = PAGE_H - 14  // baseline for header top edge
const Y_CONTENT_START = Y_TOP - HEADER_H - 6
const Y_MIN = FOOTER_H + 4

// ── Palette ────────────────────────────────────────────────────────────────
const C_BLACK     = rgb(0.102, 0.102, 0.102)  // #1a1a1a
const C_GRAY_TEXT = rgb(0.533, 0.533, 0.533)  // #888
const C_GRAY_LINE = rgb(0.867, 0.867, 0.867)  // #ddd
const C_GRAY_LIGHT= rgb(0.933, 0.933, 0.933)  // #eee
const C_GRAY_BG   = rgb(0.961, 0.961, 0.961)  // #f5f5f3 (approx)
const C_CHIP_BG   = rgb(0.941, 0.941, 0.933)  // #f0f0ee
const C_CHIP_FG   = rgb(0.267, 0.267, 0.267)  // #444

type BadgeColors = { bg: RGB; fg: RGB }
const BADGE_COLORS: Record<string, BadgeColors> = {
  peito:  { bg: rgb(0.980, 0.925, 0.906), fg: rgb(0.443, 0.169, 0.075) },
  perna:  { bg: rgb(0.918, 0.953, 0.871), fg: rgb(0.153, 0.314, 0.039) },
  costas: { bg: rgb(0.902, 0.945, 0.984), fg: rgb(0.047, 0.267, 0.486) },
  cardio: { bg: rgb(0.980, 0.933, 0.855), fg: rgb(0.388, 0.220, 0.024) },
}
const BADGE_DEFAULT: BadgeColors = { bg: C_CHIP_BG, fg: C_CHIP_FG }

// ── Main generator ─────────────────────────────────────────────────────────
export async function generatePDF(
  sessions: LocalWorkoutSession[],
  userName: string,
  periodLabel?: string,
  weightUnit: 'kg' | 'lb' = 'kg',
) {
  const pdfDoc = await PDFDocument.create()
  const font     = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Embed logo PNG (260×40px → rendered at 86×13.3pt to match spec)
  const logoResp = await fetch(logoUrl)
  const logoBytes = await logoResp.arrayBuffer()
  const logoImg = await pdfDoc.embedPng(logoBytes)
  const LOGO_W = 86
  const LOGO_H = (logoImg.height / logoImg.width) * LOGO_W

  const pages: PDFPage[] = []
  let page!: PDFPage
  let y = 0

  // ── Collect & compute all data upfront ──────────────────────────────────
  type ExSet = { reps: number; weight: number; unit: string }
  type ExData = {
    name: string
    notes: string | null
    sets: ExSet[]
    volume: string
  }
  type SessionData = {
    session: LocalWorkoutSession
    exercises: ExData[]
    isCardio: boolean
    badgeKey: string
    badgeLabel: string
  }

  let totalSets = 0
  const sessionData: SessionData[] = []
  const daysActive = new Set<string>()

  for (const session of sessions) {
    const exercises = await sessionExercisesRepo.listBySession(session.id)
    const allSets   = await sessionSetsRepo.listBySession(session.id)

    daysActive.add(session.performed_at.slice(0, 10))
    totalSets += allSets.length

    const setsByEx = new Map<string, typeof allSets>()
    for (const s of allSets) {
      const arr = setsByEx.get(s.session_exercise_id) ?? []
      arr.push(s)
      setsByEx.set(s.session_exercise_id, arr)
    }

    const exData: ExData[] = exercises.map(ex => {
      const sets = (setsByEx.get(ex.id) ?? [])
        .sort((a, b) => a.set_index - b.set_index)
        .map(s => ({ reps: s.reps, weight: s.weight, unit: s.weight_unit }))

      const totalVol = sets.reduce((acc, s) => acc + s.reps * s.weight, 0)
      const volume = totalVol > 0 ? `${totalVol.toLocaleString('pt-BR')} ${weightUnit}` : '—'

      return { name: ex.name, notes: ex.notes, sets, volume }
    })

    const isCardio = session.workout_type === 'cardio'
    const title = session.title.toLowerCase()
    let badgeKey = 'default'
    if (isCardio) badgeKey = 'cardio'
    else if (title.includes('perna') || title.includes('quad') || title.includes('glut')) badgeKey = 'perna'
    else if (title.includes('cost') || title.includes('bíc') || title.includes('bic') || title.includes('pull')) badgeKey = 'costas'
    else if (title.includes('peit') || title.includes('trí') || title.includes('tri') || title.includes('ombr')) badgeKey = 'peito'

    sessionData.push({
      session,
      exercises: exData,
      isCardio,
      badgeKey,
      badgeLabel: isCardio ? 'Cardio' : session.title,
    })
  }

  // ── Helper: formatted date parts ────────────────────────────────────────
  function fmtShort(iso: string) {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${dd}/${mm}`
  }
  function fmtFull(iso: string) {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
  }
  function fmtWeekday(iso: string) {
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(new Date(iso)).replace('.', '')
  }

  const today = new Date()
  const genDate = fmtFull(today.toISOString())
  const periodStr = periodLabel ?? genDate

  // First & last session dates for period display
  const sortedSessions = [...sessions].sort((a, b) => a.performed_at.localeCompare(b.performed_at))
  const periodDisplay = sortedSessions.length >= 2
    ? `${fmtShort(sortedSessions[0].performed_at)} – ${fmtShort(sortedSessions[sortedSessions.length - 1].performed_at)}/${today.getFullYear().toString().slice(2)}`
    : periodStr

  // Compute active days / 7
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - 6)
  const activeLast7 = [...daysActive].filter(d => new Date(d) >= startOfWeek).length
  const daysDisplay = `${activeLast7} / 7`


  // ── Page management ──────────────────────────────────────────────────────
  function newPage() {
    page = pdfDoc.addPage([PAGE_W, PAGE_H])
    pages.push(page)
    y = Y_CONTENT_START
    drawPageHeader()
  }

  function ensureSpace(needed: number) {
    if (y - needed < Y_MIN) newPage()
  }

  // ── Header (drawn on each new page) ─────────────────────────────────────
  function drawPageHeader() {
    const hY = Y_TOP  // top of header area

    // Logo PNG — centred vertically in the header band
    page.drawImage(logoImg, {
      x: ML,
      y: hY - LOGO_H + 2,
      width: LOGO_W,
      height: LOGO_H,
    })

    // Separator vertical line after logo
    const sepX = ML + LOGO_W + 8
    page.drawLine({
      start: { x: sepX, y: hY - 11 },
      end:   { x: sepX, y: hY + 2 },
      thickness: 0.5,
      color: C_GRAY_LINE,
    })

    // "Relatório de treinos" label
    page.drawText('Relatório de treinos', {
      x: sepX + 6,
      y: hY - 6,
      size: 8,
      font,
      color: C_GRAY_TEXT,
    })

    // Right side: user name
    const nameText = userName
    const namePt = 9
    const nameW = fontBold.widthOfTextAtSize(nameText, namePt)
    page.drawText(nameText, {
      x: PAGE_W - MR - nameW,
      y: hY - 1,
      size: namePt,
      font: fontBold,
      color: C_BLACK,
    })

    // Right side: period · generated on
    const subText = `${periodDisplay} · gerado em ${genDate}`
    const subPt = 7.5
    const subW = font.widthOfTextAtSize(subText, subPt)
    page.drawText(subText, {
      x: PAGE_W - MR - subW,
      y: hY - 12,
      size: subPt,
      font,
      color: C_GRAY_TEXT,
    })

    // Separator line below header
    const lineY = hY - HEADER_H + 2
    page.drawLine({
      start: { x: ML, y: lineY },
      end:   { x: PAGE_W - MR, y: lineY },
      thickness: 1.2,
      color: C_BLACK,
    })
  }

  // ── Summary cards ────────────────────────────────────────────────────────
  function drawSummaryCards() {
    const cardH = 36.85  // 13 mm
    const gap = 4
    ensureSpace(cardH + 10)
    y -= 8

    const cards = [
      { label: 'TREINOS',       value: String(sessions.length) },
      { label: 'SÉRIES TOTAIS', value: String(totalSets) },
      { label: 'DIAS ATIVOS',   value: daysDisplay },
    ]
    const cardW3 = (CONTENT_W - gap * 2) / 3

    for (let i = 0; i < cards.length; i++) {
      const cx = ML + i * (cardW3 + gap)
      const cy = y - cardH

      page.drawRectangle({
        x: cx, y: cy,
        width: cardW3, height: cardH,
        color: C_GRAY_BG,
      })

      const { label, value } = cards[i]

      page.drawText(label, {
        x: cx + 6,
        y: cy + cardH - 11,
        size: 6.5,
        font,
        color: C_GRAY_TEXT,
      })

      const valSize = value.length > 5 ? 11 : 14
      page.drawText(value, {
        x: cx + 6,
        y: cy + 6,
        size: valSize,
        font: fontBold,
        color: C_BLACK,
      })
    }

    y -= cardH + 8
  }

  // ── Calcula largura total de todos os chips de um exercício ─────────────
  function chipsTotalWidth(sets: ExSet[], padH: number, gap: number): number {
    const NUM_SIZE = 8, LBL_SIZE = 7, GAP_INNER = 2
    const unitStr = weightUnit
    let total = 0
    for (let i = 0; i < sets.length; i++) {
      const rw = fontBold.widthOfTextAtSize(String(sets[i].reps),   NUM_SIZE)
      const rl = font.widthOfTextAtSize(sets[i].reps === 1 ? 'rep' : 'reps', LBL_SIZE)
      const pw = fontBold.widthOfTextAtSize(String(sets[i].weight), NUM_SIZE)
      const ul = font.widthOfTextAtSize(unitStr,                     LBL_SIZE)
      total += (padH + rw + GAP_INNER + rl + padH) + 0.5 + (padH + pw + GAP_INNER + ul + padH)
      if (i < sets.length - 1) total += gap
    }
    return total
  }

  // ── Chip bipartido: [reps rep | peso kg] ────────────────────────────────
  function drawChipV2(
    chipPage: PDFPage,
    cx: number,
    cy: number,
    reps: number,
    weight: number,
    _isBest: boolean,
    padH = 7,
  ): number {
    const NUM_SIZE = 8
    const LBL_SIZE = 7
    const PAD_H = padH
    const PAD_V = 4
    const GAP = 2

    const bg     = C_CHIP_BG
    const numFg  = C_BLACK
    const lblFg  = C_GRAY_TEXT
    const divClr = C_GRAY_LINE

    const repsStr   = String(reps)
    const weightStr = String(weight)
    const unitStr   = weightUnit

    const repsNumW  = fontBold.widthOfTextAtSize(repsStr,   NUM_SIZE)
    const repsLabel = reps === 1 ? 'rep' : 'reps'
    const repsLblW  = font.widthOfTextAtSize(repsLabel,     LBL_SIZE)
    const wgtNumW   = fontBold.widthOfTextAtSize(weightStr, NUM_SIZE)
    const wgtLblW   = font.widthOfTextAtSize(unitStr,       LBL_SIZE)

    const leftW  = PAD_H + repsNumW + GAP + repsLblW + PAD_H
    const rightW = PAD_H + wgtNumW  + GAP + wgtLblW  + PAD_H
    const chipW  = leftW + 0.5 + rightW
    const chipH  = NUM_SIZE + PAD_V * 2

    // Background
    chipPage.drawRectangle({ x: cx, y: cy, width: chipW, height: chipH, color: bg })

    // Baseline for text: bottom pad + small offset so descenders don't clip
    const textY = cy + PAD_V + 1

    // Left side: reps number
    chipPage.drawText(repsStr, {
      x: cx + PAD_H,
      y: textY,
      size: NUM_SIZE,
      font: fontBold,
      color: numFg,
    })
    // Left side: "rep" label
    chipPage.drawText(repsLabel, {
      x: cx + PAD_H + repsNumW + GAP,
      y: textY + 0.5,
      size: LBL_SIZE,
      font,
      color: lblFg,
    })

    // Divider
    const divX = cx + leftW
    chipPage.drawLine({
      start: { x: divX, y: cy + 2 },
      end:   { x: divX, y: cy + chipH - 2 },
      thickness: 0.5,
      color: divClr,
    })

    // Right side: weight number
    const rightStartX = divX + 0.5
    chipPage.drawText(weightStr, {
      x: rightStartX + PAD_H,
      y: textY,
      size: NUM_SIZE,
      font: fontBold,
      color: numFg,
    })
    // Right side: unit label
    chipPage.drawText(unitStr, {
      x: rightStartX + PAD_H + wgtNumW + GAP,
      y: textY + 0.5,
      size: LBL_SIZE,
      font,
      color: lblFg,
    })

    return chipW
  }

  // ── Badge helper ─────────────────────────────────────────────────────────
  function drawBadge(badgePage: PDFPage, text: string, bx: number, by: number, colors: BadgeColors): number {
    const size = 7
    const tw = font.widthOfTextAtSize(text, size)
    const padH = 5, padV = 2
    const w = tw + padH * 2
    const h = size + padV * 2

    badgePage.drawRectangle({
      x: bx, y: by,
      width: w, height: h,
      color: colors.bg,
    })
    badgePage.drawText(text, {
      x: bx + padH,
      y: by + padV + 0.5,
      size,
      font,
      color: colors.fg,
    })
    return w
  }

  // ── Session renderer ─────────────────────────────────────────────────────
  function drawSession(sd: SessionData) {
    const { session, exercises, isCardio, badgeKey } = sd
    const badgeColors = BADGE_COLORS[badgeKey] ?? BADGE_DEFAULT

    // Height estimation for orphan check:
    // header row + table header + each exercise row + separator
    const exRows = isCardio ? 0 : exercises.length
    const estimatedH = 14 + (isCardio ? 20 : 14 + exRows * 28.35) + 6
    ensureSpace(Math.min(estimatedH, 60))

    // ── Section separator line ───────────────────────────────────────────
    y -= 2
    page.drawLine({
      start: { x: ML, y },
      end:   { x: PAGE_W - MR, y },
      thickness: 0.5,
      color: C_GRAY_LINE,
    })
    y -= 10

    // ── Session header: data e dia (linha 1) ─────────────────────────────
    const weekday = fmtWeekday(session.performed_at)
    const dateStr = `${fmtShort(session.performed_at)} — ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}`
    page.drawText(dateStr, {
      x: ML,
      y,
      size: 8,
      font,
      color: C_GRAY_TEXT,
    })
    y -= 13

    // ── Session header: nome do treino + badge (linha 2) ─────────────────
    page.drawText(session.title, {
      x: ML,
      y,
      size: 11,
      font: fontBold,
      color: C_BLACK,
    })
    const nameW = fontBold.widthOfTextAtSize(session.title, 11)
    const badgeLabel = badgeKey === 'default' ? '' :
      badgeKey.charAt(0).toUpperCase() + badgeKey.slice(1)
    if (badgeLabel) {
      drawBadge(page, badgeLabel, ML + nameW + 8, y - 1, badgeColors)
    }
    y -= 14

    // ── Cardio: just description text ────────────────────────────────────
    if (isCardio) {
      const desc = session.notes ?? '—'
      page.drawText(desc, {
        x: ML,
        y,
        size: 8.5,
        font,
        color: C_GRAY_TEXT,
      })
      y -= 8 + 8
      return
    }

    // ── Session notes (força) ─────────────────────────────────────────────
    if (session.notes) {
      ensureSpace(12)
      page.drawText(session.notes, {
        x: ML,
        y,
        size: 8,
        font,
        color: C_GRAY_TEXT,
      })
      y -= 14
    }

    if (exercises.length === 0) {
      page.drawText('(nenhum exercício registrado)', {
        x: ML, y, size: 8, font, color: C_GRAY_TEXT,
      })
      y -= 20
      return
    }

    // ── Table header ──────────────────────────────────────────────────────
    const COL_SERIES   = ML + CONTENT_W * 0.35
    const COL_SERIES_W = (PAGE_W - MR) - COL_SERIES

    page.drawText('EXERCÍCIO', { x: ML,         y, size: 6.5, font, color: C_GRAY_TEXT })
    page.drawText('SÉRIES',    { x: COL_SERIES, y, size: 6.5, font, color: C_GRAY_TEXT })
    y -= 4

    page.drawLine({
      start: { x: ML, y },
      end:   { x: PAGE_W - MR, y },
      thickness: 0.4,
      color: C_GRAY_LINE,
    })
    y -= 3

    // ── Exercise rows ─────────────────────────────────────────────────────
    const ROW_H = 34.02  // 12 mm — acomoda chip bipartido com dois labels

    for (const ex of exercises) {
      ensureSpace(ROW_H + 4)

      const rowTop = y
      const rowBot = rowTop - ROW_H
      const textY  = rowBot + (ROW_H - 8) / 2 + 2

      // Exercise name
      page.drawText(ex.name, {
        x: ML,
        y: textY,
        size: 8.5,
        font,
        color: C_BLACK,
      })

      // Padding adaptativo: garante que todos os chips cabem na coluna SÉRIES
      const chipH = 8 + 4 * 2  // NUM_SIZE + PAD_V*2
      const chipY = rowBot + (ROW_H - chipH) / 2  // centralizado verticalmente (fix 4)

      let padH = 7, chipGap = 4
      if (chipsTotalWidth(ex.sets, 7, 4) > COL_SERIES_W) {
        padH = 5; chipGap = 3
      }
      if (chipsTotalWidth(ex.sets, 5, 3) > COL_SERIES_W) {
        padH = 4; chipGap = 2
      }

      // Fix 2: ordem original (sem reversed/sorted)
      let chipX = COL_SERIES
      for (let i = 0; i < ex.sets.length; i++) {
        const s = ex.sets[i]
        const w = drawChipV2(page, chipX, chipY, s.reps, s.weight, false, padH)
        chipX += w + chipGap
      }

      y = rowBot

      // Row separator
      page.drawLine({
        start: { x: ML,          y },
        end:   { x: PAGE_W - MR, y },
        thickness: 0.3,
        color: C_GRAY_LIGHT,
      })
    }

    y -= 6
  }

  // ── Footers (stamped after all pages are known) ──────────────────────────
  function stampFooters() {
    const total = pages.length
    const exportText = `Trainotes · Exportado em ${genDate}`

    for (let i = 0; i < total; i++) {
      const p = pages[i]
      const pageText = `Pág. ${i + 1} / ${total}`

      // Separator line
      p.drawLine({
        start: { x: ML,          y: FOOTER_H - 4 },
        end:   { x: PAGE_W - MR, y: FOOTER_H - 4 },
        thickness: 0.4,
        color: C_GRAY_LINE,
      })

      // Left: export info
      p.drawText(exportText, {
        x: ML,
        y: FOOTER_H - 14,
        size: 7,
        font,
        color: C_GRAY_TEXT,
      })

      // Right: page number
      const pw = font.widthOfTextAtSize(pageText, 7)
      p.drawText(pageText, {
        x: PAGE_W - MR - pw,
        y: FOOTER_H - 14,
        size: 7,
        font,
        color: C_GRAY_TEXT,
      })
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  newPage()
  drawSummaryCards()

  for (const sd of sessionData) {
    drawSession(sd)
  }

  stampFooters()

  // ── Save & share ─────────────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save()
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })

  if (navigator.share) {
    const file = new File([blob], 'trainotes-relatorio.pdf', { type: 'application/pdf' })
    await navigator.share({ files: [file], title: 'Relatório Trainotes' })
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trainotes-relatorio.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }
}

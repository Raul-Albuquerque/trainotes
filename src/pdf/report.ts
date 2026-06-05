import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { LocalWorkoutSession } from '../domain/types'
import { formatDate } from '../lib/utils'

export async function generatePDF(sessions: LocalWorkoutSession[], userName: string, periodLabel?: string) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const pageWidth = 595
  const pageHeight = 842
  const margin = 50
  const lineHeight = 18

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  function checkNewPage(needed = lineHeight * 2) {
    if (y < margin + needed) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
  }

  function drawText(text: string, x: number, size = 11, bold = false, color = rgb(0.13, 0.13, 0.13)) {
    page.drawText(text, { x, y, size, font: bold ? fontBold : font, color })
    y -= lineHeight
  }

  // Header
  drawText('Relatório de Treinos — Trainotes', margin, 16, true)
  drawText(`Usuário: ${userName}`, margin, 10)
  drawText(`Gerado em: ${formatDate(new Date().toISOString())}`, margin, 10)
  if (periodLabel) drawText(`Período: ${periodLabel}`, margin, 10)
  drawText(`Total de treinos: ${sessions.length}`, margin, 10)
  y -= lineHeight

  for (const session of sessions) {
    checkNewPage(lineHeight * 4)
    drawText(`${formatDate(session.performed_at)} — ${session.title}`, margin, 12, true)
    if (session.notes) drawText(`  Obs: ${session.notes}`, margin, 9)
    y -= 4
  }

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

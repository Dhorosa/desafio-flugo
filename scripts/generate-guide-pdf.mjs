import fs from 'node:fs'
import path from 'node:path'
import PDFDocument from 'pdfkit'

const projectRoot = process.cwd()
const inputPath = path.join(projectRoot, 'docs', 'guia-entrevista.md')
const outputPath = path.join(projectRoot, 'docs', 'guia-entrevista.pdf')

const markdown = fs.readFileSync(inputPath, 'utf8')
const lines = markdown.split(/\r?\n/)

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  info: {
    Title: 'Guia de Entrevista Tecnica - Desafio Flugo',
    Author: 'Codex',
    Subject: 'Explicacao tecnica do projeto',
  },
})

doc.pipe(fs.createWriteStream(outputPath))

const writeLine = (text, options = {}) => {
  doc.font(options.font || 'Helvetica').fontSize(options.size || 11).fillColor('black')
  doc.text(text, {
    width: 495,
    align: 'left',
    lineGap: options.lineGap ?? 2,
  })
}

for (const rawLine of lines) {
  const line = rawLine.trimEnd()

  if (line.startsWith('# ')) {
    doc.moveDown(0.4)
    writeLine(line.replace(/^#\s+/, ''), { font: 'Helvetica-Bold', size: 18, lineGap: 4 })
    doc.moveDown(0.3)
    continue
  }

  if (line.startsWith('## ')) {
    doc.moveDown(0.25)
    writeLine(line.replace(/^##\s+/, ''), { font: 'Helvetica-Bold', size: 14, lineGap: 3 })
    doc.moveDown(0.1)
    continue
  }

  if (line.startsWith('### ')) {
    writeLine(line.replace(/^###\s+/, ''), { font: 'Helvetica-Bold', size: 12, lineGap: 2 })
    continue
  }

  if (line === '') {
    doc.moveDown(0.35)
    continue
  }

  if (line.startsWith('- ')) {
    writeLine(`- ${line.slice(2)}`, { size: 11 })
    continue
  }

  if (/^\d+\.\s/.test(line)) {
    writeLine(line, { size: 11 })
    continue
  }

  if (line.startsWith('`') && line.endsWith('`')) {
    writeLine(line.slice(1, -1), { font: 'Courier', size: 10 })
    continue
  }

  writeLine(line, { size: 11 })
}

doc.end()
console.log(`PDF gerado em: ${outputPath}`)

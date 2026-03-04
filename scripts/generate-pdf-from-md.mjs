import fs from 'node:fs'
import path from 'node:path'
import PDFDocument from 'pdfkit'

const [, , inputArg, outputArg] = process.argv

if (!inputArg || !outputArg) {
  console.error('Usage: node scripts/generate-pdf-from-md.mjs <input-md> <output-pdf>')
  process.exit(1)
}

const inputPath = path.resolve(process.cwd(), inputArg)
const outputPath = path.resolve(process.cwd(), outputArg)

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`)
  process.exit(1)
}

const markdown = fs.readFileSync(inputPath, 'utf8')
const lines = markdown.split(/\r?\n/)

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
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

  writeLine(line, { size: 11 })
}

doc.end()
console.log(`PDF generated: ${outputPath}`)

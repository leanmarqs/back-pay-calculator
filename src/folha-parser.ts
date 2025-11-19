import { readFile } from 'node:fs/promises'
import { writeFile } from 'node:fs/promises'

import ExcelJS from 'exceljs'
import { PDFParse } from 'pdf-parse'

type RD = 'R' | 'D'
const alowedItems: string[] = ['VENCIMENTO BASICO', 'IQ - 52% - LEI 11.091/05 AT']

function formatTable(lines: string[], separator: string = '|') {
  const rows: string[][] = lines.map((line) => line.split(separator).map((col) => col.trim()))

  // Calcula tamanho máximo de cada coluna
  const colWidths: number[] = []
  rows.forEach((cols: string[]) => {
    cols.forEach((col: string, i: number) => {
      colWidths[i] = Math.max(colWidths[i] || 0, col.length)
    })
  })

  // Reconstrói a tabela com padding correto
  return rows.map((cols: string[]) =>
    cols.map((col: string, i: number) => col.padEnd(colWidths[i], ' ')).join(' | '),
  )
}

function getData(lines: string[]): string[] {
  let store: boolean = false
  let rd: RD = new Object() as RD
  const folhas: string[] = []
  const regex = /\d{4}\s*-\s*\dº\s+Semestre/
  let semester: string = ''

  lines.forEach((line) => {
    // console.log(`Processing line: ${line}`)
    const result: RegExpMatchArray | null = line.match(regex)

    if (result) {
      semester = result[0].trim()
      console.log(`Found semester: ${semester}`)
      folhas.push(`${semester}`)
    }

    store = line.includes('Rubrica') ? true : store

    if (store === true) {
      const data = line.split('|')
      if (
        /*data[0].trim() !== 'Rubrica' &&  data[0].trim() !== '*****' &&*/
        data[0].trim() !== ''
      ) {
        rd = data[2].trim() === 'R' ? 'R' : data[2].trim() === 'D' ? 'D' : rd

        rd = data[1].trim().includes('TOTAL BRUTO') ? 'R' : rd
        rd = data[1].trim().includes('TOTAL DESCONTOS') ? 'D' : rd
        rd = data[1].trim().includes('TOTAL LÍQUIDO') ? 'R' : rd

        if (data[2].trim() === '') {
          data[2] = rd
        }

        if (data[4].trim() === '') data[4] = '0,00'
        if (data[5].trim() === '') data[5] = '0,00'
        if (data[6].trim() === '') data[6] = '0,00'
        if (data[7].trim() === '') data[7] = '0,00'
        if (data[8].trim() === '') data[8] = '0,00'
        if (data[9].trim() === '') data[9] = '0,00'

        folhas.push(data.join('|') + '\n')
      }
    }

    store = line.includes('TOTAL LÍQUIDO') ? false : store
  })

  return folhas
}

async function saveToExcel(filename: string, rawLines: string[]) {
  const workbook = new ExcelJS.Workbook()
  const filepath = `./${filename}.xlsx`
  let worksheet

  // Se o arquivo existir → atualiza; se não, cria
  try {
    await workbook.xlsx.readFile(filepath)
    worksheet = workbook.getWorksheet('Folhas')
    if (!worksheet) worksheet = workbook.addWorksheet('Folhas')
    console.log(`Atualizando arquivo existente: ${filepath}`)
  } catch (err) {
    console.log(`Criando arquivo novo: ${filepath}`)
    worksheet = workbook.addWorksheet('Folhas')
  }

  rawLines.forEach((line) => {
    // Caso seja a linha "2025 - 1º Semestre"
    if (!line.includes('|')) {
      worksheet.addRow([line])
      return
    }

    const cols = line.split('|').map((c) => c.trim())

    // Se a rubrica (coluna [1]) não é permitida → ignorar
    const rubricaNome = cols[1] || ''
    const isAllowed = alowedItems.some((item) => rubricaNome.includes(item))

    if (!isAllowed) return // <-- 🔥 LINHA EXCLUÍDA

    // Insere a linha no Excel
    const row = worksheet.addRow(cols)

    // ---------- APLICA FORMATO FINANCEIRO ----------
    row.eachCell((cell) => {
      const value = cell.value

      if (typeof value !== 'string') return
      if (!value.match(/^\d{1,3}(\.\d{3})*,\d{2}$/)) return

      const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'))

      cell.value = numericValue
      cell.numFmt = 'R$ #,##0.00'
    })
  })

  // Ajustar largura das colunas automaticamente
  worksheet.columns.forEach((col) => {
    let max: number = 12
    col.eachCell((cell) => {
      max = Math.max(max, String(cell.value).length + 2)
    })
    col.width = max
  })

  await workbook.xlsx.writeFile(filepath)
  console.log(`Arquivo Excel salvo em: ${filepath}`)
}

async function saveToTxt(filename: string, content: string) {
  await writeFile(`./${filename}.txt`, content, 'utf-8')
  console.log(`Arquivo ${filename}.txt salvo com sucesso!`)
}

async function parseFolha() {
  const buffer = await readFile('relatorio-2023-2025.pdf')
  const parser = new PDFParse({ data: buffer })

  // const result = await parser.getTable()
  const result = await parser.getText()
  await parser.destroy()
  const data: string[] = []

  result.pages.forEach(async (page) => {
    const lines = page.text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    data.push(...getData(lines))

    const formatted: string[] = formatTable(data.map((l) => l.replace('\n', '')))

    formatted.forEach((line: string) => console.log(line))
  })

  const formattedLines = formatTable(data.map((l) => l.replace('\n', '')))

  // await saveToTxt('relatorio-financeiro', formattedLines.join('\n'))

  // Salvar Excel
  await saveToExcel('relatorio-financeiro', formattedLines)
}

parseFolha()

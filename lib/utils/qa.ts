export interface QAEntry {
  analyst: string
  companyRepresentative: string | null
  questionTopic: string
  keyPoints: string
  quantitativeData: string
  managementResponse: string
}

export function parseQATable(markdown: string): QAEntry[] {
  const sectionIndex = markdown.indexOf('# Question and Answer Details')
  if (sectionIndex === -1) return []
  const lines = markdown
    .slice(sectionIndex)
    .split('\n')
    .slice(1)
  const tableLines: string[] = []
  let inTable = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('|')) {
      if (!inTable) {
        inTable = true
        continue // skip header
      }
      if (trimmed.startsWith('|---')) continue
      tableLines.push(trimmed)
    } else if (inTable) {
      break
    }
  }

  return tableLines.map(row => {
    const cells = row.split('|').slice(1, -1).map(c => c.trim())
    const management = cells[5] || ''
    const repMatch = management.match(/^([A-Z][A-Za-z .'-]+):/)
    return {
      analyst: cells[0] || '',
      companyRepresentative: repMatch ? repMatch[1] : null,
      questionTopic: cells[2] || '',
      keyPoints: cells[3] || '',
      quantitativeData: cells[4] || '',
      managementResponse: management
    }
  })
}

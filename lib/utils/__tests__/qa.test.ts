import { parseQATable } from '../qa'

describe('parseQATable', () => {
  it('parses rows from markdown table', () => {
    const md = `# Question and Answer Details\n| Analyst | Firm | Question Topic | Key Points | Quantitative Data | Management Response |\n|---------|------|----------------|------------|-------------------|-------------------|\n| John Doe | XYZ | Guidance | Strong results | Revenue up 10% | Jane Smith: We expect growth |`
    const rows = parseQATable(md)
    expect(rows.length).toBe(1)
    expect(rows[0].analyst).toBe('John Doe')
    expect(rows[0].companyRepresentative).toBe('Jane Smith')
  })
})

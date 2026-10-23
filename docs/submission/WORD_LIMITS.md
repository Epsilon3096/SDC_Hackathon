# Official response word-limit check

Counts use conservative whitespace-separated tokens within the marked response bodies, including inline citation markers. Headings, editorial notes, tables outside these answers and source appendices are excluded. All bodies retain margin for final edits. Repeat after changes and inspect the final PDFs for overflow.

| Response | Count | Maximum | Status |
| --- | ---: | ---: | --- |
| P2.1 | 201 | 250 | Pass |
| P2.2 | 266 | 300 | Pass |
| P3.2 | 191 | 200 | Pass |
| T2.1 | 187 | 200 | Pass |
| T4.3 | 88 | 100 | Pass |
| T5 | 73 | 100 | Pass |
| T6.1 | 143 | 150 | Pass |
| T6.2 | 147 | 150 | Pass |

Reproduce: `node docs/submission/check-word-limits.mjs`.

# Handbook verification

Verified with `npm run test:handbook` against the final generated files in real headless Chrome 151.0.7922.109.

- The canonical source is byte-identical to the attachment: SHA-256 `771f10d6f2a81ca3e645500137495fc6e60dceb6f831e1a970a008c2f3552f37`.
- All 927 source blocks match independently extracted rendered text, including paragraph boundaries, headings, punctuation, lists and quotations. All 57 numbered chapters, introduction and closing thought are present. The question list contains 40 items; the golden rules contain 15.
- A rebuild produces identical public assets. Existing homepage search, desktop/mobile handbook links, chapter links, keyboard focus, Escape, back/forward history and motion preference persistence pass.
- Captured desktop (1440×1000), tablet (768×1024), phone (390×844) and small phone (320×740). Inspected contact sheets and individual intermediate frames. No horizontal overflow or hidden source text.
- Hero depth, category planes, institutional line, document stack, S.T.O.P. states and the final analysis respond to forward and reverse scrolling. S.T.O.P. has a dedicated check matching each illuminated letter to its source instruction.
- Text contrast passes 4.5:1 for normal text and 3:1 for large text against the rendered solid surfaces. The check caught and resolved a closing-background specificity conflict.
- Reduced motion, live OS preference changes and disabled JavaScript retain all text. Print output was generated as an A4 PDF. The 200% browser-zoom layout was simulated with a halved CSS viewport and doubled pixel ratio.
- No browser JavaScript errors. `git diff --check` passes.

## Visual review

The opening has the intended document depth and readable typography in both compositions. The document stack resolves through its five labels without hiding the source. The concluding analysis holds its questions beside the diagram before the yellow closing passage. The feeling curve reads as orientation, recognition, clarity and calm; the final yellow section supplies the strongest visual release. No added empty scroll spans or generated media.

Local captures, two contact sheets, machine-readable results and the print PDF are in the ignored `evidence/` folder. They can be regenerated with the test command.

Actual physical-phone scrolling and iOS Safari were not tested. No deployment was performed.

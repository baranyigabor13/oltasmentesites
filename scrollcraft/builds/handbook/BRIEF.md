# A manipuláció anatómiája

## Evidence and creative decisions

- User: “Build a premium scroll experience for the attached text and do not rewrite the text.”
- User selects “Cinematic scenes”, “Typography and diagrams”, “Main menu and homepage”, and “Adapted cinematic”.
- Authority: approved implementation plan in this task. Source order, all wording, and design.html are authoritative.
- Audience: Hungarian-speaking parents reading the supplied handbook.
- Art direction: charcoal, yellow, Inter and JetBrains Mono from the existing design system. Exact-text document diagrams; no photographic generation.
- Structure: cinematic chapter sequences interspersed with complete, naturally flowing text. This is an explicitly requested combination rather than the skill's filmic one-shot grammar (which would forbid the required index).
- Primary action: Olvasás megkezdése. Ending: full original closing thought and navigation back to the top or homepage.
- Assets: source manuscript and existing design tokens; diagrams authored as semantic HTML and decorative SVG. No external asset budget.

## Feeling curve and score

| Passage | Feeling | Visual cause / device |
|---|---|---|
| Title | Curiosity | Layered document outlines recede behind oversized type; parallax |
| Introduction and I | Orientation | Quiet prose, full original context; flow |
| II | Clarity | Three categories separate into planes; transform |
| III | Comprehension | Line traces the institutional chain; reveal |
| IV–XI | Recognition | Original examples and contrasting typescales; flow |
| XII | Attention | Five document steps stack; sticky assembly |
| XIII–XL | Reflection | Readable chapters and selected accent-ground pauses; flow |
| XLI | Control | S.T.O.P. lights one stage at a time; sticky state |
| XLII–LVI | Confidence | Complete practical questions and methods; flow |
| LVII | Clarity, peak | Five phrases connect to precise questions, then four large concluding lines; sticky diagram |
| Closing thought | Calm | Quiet yellow-ground closing passage; static resolve |

Signature move: the handbook makes the language in a sentence visibly separable into the questions already given in the manuscript. The complete source remains in reading order alongside the diagram.

Tell-someone sentence: “It's the site where a threatening sentence becomes five precise questions.”

No empty scroll spans. The peak receives the longest authored concluding sequence; long prose elsewhere retains its natural length. Mobile diagrams have shorter pin lifetimes, and content that cannot fit releases automatically. Motion-off and print show all content.

## Verification approach

Use the repository's installed Puppeteer and real Chrome for browser verification. The skill preflight passed Node, full ffmpeg and Chrome. Optional Playwright and image-generation credentials are unnecessary for this non-photographic implementation.

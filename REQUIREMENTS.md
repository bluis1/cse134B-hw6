# HW6 requirement check

This checklist covers every required item in the pasted instructions, which the owner confirmed are the complete assignment. The text does not include a separate scoring table. No HW5 point values are reused here.

## Project and repository

| Requirement | Implementation or status |
| --- | --- |
| Begin with a copy of HW5 | The original ZIP was read without modification. Its Eleventy configuration, source pages, theme script, styles, images, and preview helper were copied into this folder and adapted. |
| New HW6 repository; do not push to HW5 | The owner created and pushed `https://github.com/bluis1/cse134B-hw6`. The local `origin` points to that HW6 repository. The existing commit is authored and committed by `bluis1 <bluis@ucsd.edu>`, with no coauthor trailers. Final documentation/evidence changes remain for the owner's manual commit and push. |
| Astro or Eleventy is the main project | Eleventy 3.1.8, `package.json`, lockfile, and `eleventy.config.js` are at the root. |
| One build produces the full site | `npm run build` writes all nine pages plus local assets to `dist/`. |
| Keep source, configuration, dependency lockfile | Present in the public repository. `node_modules` and generated output are ignored. Final documentation/evidence changes need the owner's last commit. |
| Remove unrelated coursework and unused copies | No cheese exercise, old standalone site, `ssg-exercise`, random facts widget, separate form exercises, or unused sample audio/video. No experiments are retained that need separate labeling. |
| Fresh-checkout build and preview | `npm run verify:clean` passed in a clean temporary source copy with a separate install and HTTP preview. README names Node/npm versions and install/build/preview commands. |
| Local finished-output preview | `scripts/serve.mjs` serves `dist/`; browser tests request all pages directly. |
| Deploy publicly and compare with local preview | `https://cse134b-hw6.netlify.app/` is public. All nine pages pass browser checks, and all 17 deployed output files match the local build, allowing line-ending changes and Netlify's hosting additions. |
| Portable complete static output | `dist/` includes HTML, CSS, scripts, and used images. Templates use the `url` filter and do not embed a hosting domain. A nested path-prefix build is tested. |

## Part 1: shared portfolio

| Requirement | Implementation or evidence |
| --- | --- |
| Use the HW5 SSG exercise as the starting point | Root config and Home/About templates began as copies of the HW5 Eleventy exercise. |
| Migrate homepage and at least two other pages | Home, About, Projects, Skills, Interests, and Contact all use the main generator. |
| Preserve relevant design, content, assets, scripts | Original navy/gold serif design, responsive styling, profile images, earlier portfolio screenshot, coursework, and theme switching remain. Contact uses the owner's supplied school email. |
| Clear audience and visitor route | Home introduces a CS student and directs someone reviewing the work to Projects and Contact. Project titles lead to detail pages. |
| Shared repeated markup | `base.njk` owns the head/navigation/main wrapper; `footer.njk` owns the footer. Individual pages keep their own main content. |
| Styles, responsive layout, keyboard focus, themes | Shared CSS, focus outlines, skip link, native controls, narrow viewport rules, and light/dark variables. |
| Build and preview all migrated pages | All nine returned HTTP 200 in browser checks and clean-copy preview. |
| Navigate from home; open pages directly with working assets | Browser tests follow links and visit each route directly; styles/scripts and images load. |
| Edit shared section, rebuild, check every page | Temporary-copy test edits footer text and verifies all nine output pages. |
| Narrow viewport and visible keyboard focus | All nine pages checked at 360px without horizontal overflow; keyboard focus and controls tested. Screenshots saved in `docs/screenshots/`. |

## Part 2: collection

| Requirement | Implementation or evidence |
| --- | --- |
| Related content useful to visitors | Three coursework projects from the existing portfolio. |
| Single content source with title, summary, useful detail content | `src/_data/projects.json`: title, summary, tools, overview, process, and learning for each entry. |
| Index with titles, summaries, and links | `src/projects.njk`, reached through the shared Projects navigation. |
| One shared detail template; own URLs and index link | `src/project.njk` paginates JSON into `/projects/<slug>/`; every detail page links back. |
| Both views use the same entries | Index and detail template read `projects`; title-change test confirms both outputs. |
| Build with two entries first | Temporary-copy test builds portfolio and Nachos and checks that the third page does not exist. |
| Add third entry through content only; rebuild | Test writes the third JSON entry without modifying templates, then verifies the index and new detail page. |
| Final collection has at least three entries | Portfolio, Nachos threads, and horror sound design. |
| New page opens directly, including no-JS browsing | Direct requests and no-JavaScript browser navigation pass for the third entry and index. |

## Part 3: visitor-focused Web Component

| Requirement | Implementation or evidence |
| --- | --- |
| Component supports an intended visitor task | A reviewer can check the earlier portfolio source's public activity and open its repository from the portfolio detail page. |
| Placement and clear label | `/projects/personal-portfolio/#source-activity`, under “Look at the earlier portfolio source.” Home → Projects → Personal Portfolio Website reaches it. |
| Registered custom element included in generated site | `RepoPanel extends HTMLElement`; `customElements.define("repo-panel", RepoPanel)`; deferred scripts included by the shared layout only where needed. |
| API response updates UI without reload | `loadActivity()` fetches `https://api.github.com/repos/bluis1/cse134B-hw5`; updates last push, branch, language, and status. Real browser request passed. |
| Check HTTP and response shape | Explicit `response.ok` check, identity/date/branch/language validation, caught JSON errors. |
| Safe display | API values enter `textContent`. Browser test sends markup in a field and confirms it creates no image element. Source link is built from validated local repository identity. |
| Loading, success, failure, retry | Persistent polite live region, request button disabled during loading, controls restored in `finally`, 10-second abort, explicit stale-result warning, enabled same-page retry. |
| External page control changes observed attribute | `repo-controls.js` toggles `compact`; `observedAttributes`, callback, and `updateMode()` update details and spacing. |
| Sensible saved preference | `hw6-repo-panel-mode` stores compact/expanded; validated restoration and guarded storage reads/writes. |
| CSS custom properties fit both themes | `repo-panel.css` consumes background, text, accent, muted, and error variables. Both themes tested and captured. |
| Keyboard operation | Native buttons, Enter/Space activation, visible focus, working links. |
| Failed request after load and successful retry | Browser test loads success, intercepts later network/HTTP/JSON/shape failures, verifies retained result and enabled retry, then restores success without navigation. |
| No-JS main content and fallback | Generated HTML stays readable; ordinary navigation works; static source link and `noscript` explanation remain; JS-only buttons stay hidden. |
| Repeat checks on deployed site | All five public-site browser test groups pass, including real API success, deliberate request blocking, successful unblocked retry, keyboard use, storage, both themes, mobile layout, and no-JavaScript navigation. README answer 2 records deployed observations. |

## Part 4: Portfolio Walkthrough

| Requirement | README evidence |
| --- | --- |
| Root README section named Portfolio Walkthrough | Present with answers numbered 1–5. |
| Q1: audience, task, visitor path, placement, files, build/browser/network behavior | Answer 1 addresses each item with concrete labels, deployed links, routes, and source paths. |
| Q2: successful, blocked, retried request; no-JS observations; relevant code | Answer 2 documents deployed results, screenshots, the real blocked/unblocked API sequence, no-JavaScript behavior, and code paths. |
| Q3: select one option | Selected HTTP errors: why `fetch()` resolves a 404, where `response.ok` is checked, and visitor feedback. |
| Q4: select one scenario, design and technical proposal | Selected API unavailability: dated cross-visit cache proposal, source files, age/validation rules, visitor benefit, tradeoff, and tests. Clearly labeled unimplemented. |
| Q5: short excerpt from an allowed source and exact AI review prompt | The excerpt is the HTTP/status and response-validation code in the Web Component's `loadActivity()` method, preserved with the exact prompt in `docs/ai-review.html`. |
| Readable screenshot of AI response in README and repository | `docs/ai-review.png`, a real browser screenshot of the saved response, embedded in README. It is explicitly labeled a saved-response transcript rather than original chat UI. If the instructor wants chat UI specifically, the owner must replace it. |
| Check AI reasoning, cite supporting/contradicting code, evaluate suggestion, describe tests | Answer 5 checks the inline validation and the surrounding error/retry/safe-rendering code, evaluates extracting a named validation function, explains its tradeoff, and lists field-validation and browser checks. |

## Deliverables

| Requirement | Status |
| --- | --- |
| One plain-text `links.txt`, four full HTTPS URLs in required order | Generated from the actual public repository and Netlify URL. All four URLs were accessed without authentication. The file and README link update need the final manual commit and Gradescope submission. |
| Repository root, homepage, index, component page | Generator writes exactly these four lines; component route is `/projects/personal-portfolio/`. |
| Public access and source/deployment match through grading | Public access and matching output verified on November 27, 2026. The owner must keep both online through grading and confirm Netlify rebuilds after the final documentation commit. |
| README build, preview, Node version, output folder | Present. |
| README shared-layout and collection rebuild checks, affected deployed links | Source paths, reproduction steps, local rebuild evidence, and actual deployed page links are present. |
| README all selected walkthrough answers and committed AI screenshot | Files are present; owner must review and commit manually. |
| Extra credit if completed | Not attempted. Optional SPA/POST requirements are not presented as required portfolio work or claimed as complete. |

## Methods and boundaries

The supplied HW6 text requires Astro or Eleventy, and this project uses Eleventy. It calls for real API requests, safe rendering, localStorage, shared layouts, generated content, and a portable static build; those methods are used directly. It explicitly requests an AI review for question 5. The optional SPA section recommends practicing JavaScript by hand and has been left for the owner. The pasted text is the complete assignment source for this checklist.

# Verification notes

Local checks passed on November 27, 2026 with Node 24.11.0, npm 11.6.1, and installed Google Chrome. The HW6 repository and public host have not been created yet. These results describe the local built output.

## Completed

- `npm run build`: Eleventy generates nine HTML pages and copies eight local assets into `dist/`.
- `npm test`: seven test groups pass. Five use real Chrome through Playwright; one builds edited source copies, and one checks the four-line submission helper and README links in a temporary folder.
- `npm run verify:clean`: a new temporary source copy installs with `npm ci`, builds, starts an HTTP preview, and returns HTTP 200 for all nine pages and representative nested assets.
- Direct requests, internal links, script/style responses, loaded images, one main heading, and one current navigation item were checked on all pages.
- Keyboard checks cover the skip link, a visible focus outline, mode toggle with Enter/Space, request button activation, and preference restoration.
- Both themes work; a reload restores the selected theme. Blocked localStorage reads and writes do not stop either control.
- Failure tests cover a network error after an initial success, HTTP 404, rate limiting, malformed JSON, invalid response fields, retained results, and same-page recovery. API markup is displayed as text.
- The actual GitHub API request succeeds from Chrome; the screenshot records the live result. Failure-state screenshots use intercepted requests so they are reproducible.
- With JavaScript disabled and reduced motion requested, Home → Projects → the third entry works using ordinary links. The component page keeps the source link and fallback explanation; enhancement-only controls are hidden.
- Every page fits a 360px-wide viewport without horizontal overflow. Desktop, mobile, both themes, real API success, blocked requests, and no-JS screenshots were captured. The home and AI-review screenshots were visually inspected.
- The rebuild test starts with two entries, adds the third through JSON only, checks both outputs, changes a shared footer across all nine pages, and checks a title edit and `/portfolio/` path-prefix build.

The API request has a ten-second timeout in code. Screen-reader announcement timing and behavior in browsers other than Chrome have not been manually verified.

## Repeating the local checks

```sh
npm ci
npm run build
npm test
npm run verify:clean
npm run preview
```

The tests use an available local port automatically. The normal preview is <http://127.0.0.1:8081/>. If that port is occupied, set `PORT` before running it. Do not use `file:` URLs to test storage or requests.

The tests expect an installed Google Chrome. If it is unavailable on another computer, install Chrome or change the Playwright launch channel to a browser available on that machine. This does not affect the build.

## Public deployment checks still required

Run these after creating the HW6 repository and publishing its build. Record the actual observations in README answer 2; do not claim the local checks were run on a public host.

1. Open the repository and all four generated `links.txt` URLs while signed out. Confirm that the site is HW6 and reflects the source that was pushed.
2. From Home, use Projects, open all three entries, return to the index, then use About, Skills, Interests, and Contact. Open each nested page directly and reload it. Check styles, profile images, the portfolio screenshot, and scripts.
3. Repeat the footer edit and content-only third-entry checks described in README on a temporary branch or copy. Publish the intended final three-entry source after restoring the footer.
4. At 360px and a desktop width, read each page and check for clipping. Tab through links and buttons; focus must be visible. Use Enter and Space on the component controls. Try the page in both themes.
5. On the portfolio detail page, click **Check GitHub activity**. Confirm the push date, branch, language, source link, and success status appear. Toggle details, reload, and confirm the preference is restored. Expand details and reload again to check the other direction.
6. After a successful request, use browser developer tools to block `https://api.github.com/repos/bluis1/cse134B-hw5`. Activate **Refresh GitHub activity**. Confirm the error, stale-result explanation, and **Try GitHub again** button. The project, source link, and display control must remain usable.
7. Remove the request block and retry without reloading. Confirm success. If GitHub rate-limits the IP, wait and repeat; the rate-limit message is not evidence of a successful fresh response.
8. Disable JavaScript and reload Home, Projects, the third detail page, and the portfolio detail page. Follow the collection links, verify the source fallback and explanation, and confirm no dead enhancement-only controls are visible.
9. Compare the public pages with local `dist/`, fill in the actual deployment links using `npm run links -- …`, commit the updated README and `links.txt` manually, and submit only `links.txt` to Gradescope. Keep the repository and site public through grading.

## AI review evidence

`docs/ai-review.html` preserves the exact assignment prompt, the shared excerpt, and the saved Codex response. `npm run capture:review` captures it in Chrome as `docs/ai-review.png`, which is embedded in README. This is a screenshot of the response transcript displayed in a browser, not an imitation of chat UI. Review it before committing. If an original chat-interface screenshot is required by the instructor, replace the image with that screenshot.

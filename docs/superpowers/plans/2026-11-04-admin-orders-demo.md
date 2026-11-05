# Standalone Demo Orders Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish an independent GitHub Pages demo of fictional orders whose status is stored only in a visitor browser.

**Architecture:** Static files in `site/` contain the page. The pure model in `site/order-model.js` is independently unit-tested; `site/app.js` renders it and owns browser storage. A Pages workflow uploads only `site/` after tests and audit.

**Tech Stack:** HTML, CSS, ES modules, Node.js built-in test runner, GitHub Actions Pages.

**Spec:** `docs/superpowers/specs/2026-11-04-admin-orders-demo-design.md`

## Global Constraints

- Use only the separate `fashion-store-admin-demo` repository. Do not edit `Tg_katalog`, `tg-app/`, or `admin-app/`.
- Keep the exact visible notice: `Демо-версия. Данные тестовые и не отправляются на сервер`.
- Store only status overrides in browser `localStorage` under `demo-orders-statuses-v1`.
- No login, password, passkey, real order, database, network call, external SDK, or customer message.
- No delivered `site/` file may contain a secret, service URL, `API`, `Telegram`, `Supabase`, `Beget`, or `база данных`.
- Support 320, 375, 430 px and desktop; native controls, visible focus and 44 px action targets.
- Use test-first development and no third-party package.

## File Structure

- `package.json` — ESM plus test/audit commands.
- `tests/order-model.test.mjs` — pure behavior tests.
- `site/order-model.js` — fixtures, status updates, filters and counters.
- `site/index.html` — semantic shell and required notice.
- `site/app.js` — rendering, controls and local persistence.
- `site/styles.css` — responsive visual language.
- `scripts/audit-demo.mjs` — scan only delivered source.
- `.github/workflows/deploy-pages.yml` — Pages workflow uploading `site/` only.
- `README.md` — scope and local checks.

---

### Task 1: Tested order model

**Files:**
- Create: `package.json`
- Create: `tests/order-model.test.mjs`
- Create: `site/order-model.js`

**Interfaces:**
- Export `TEST_ORDERS`, `STATUS`, `FILTER`, `createOrderState(orders, savedStatuses)`, `changeOrderStatus(state, orderId, nextStatus)`, `getFilteredOrders(state, filter)`, `getStatusCounts(state)`.
- State shape: `{ orders: Array<Order> }`; an order has `id`, `customer`, `placedAt`, `total`, `status`, `items`.
- Invalid inputs throw `Error('Unknown order')` or `Error('Unknown status')`.

- [ ] **Step 1: Add package commands and the first failing test**

```json
{"type":"module","scripts":{"test":"node --test tests/*.test.mjs","audit:demo":"node scripts/audit-demo.mjs"}}
```

```js
test('changes one status without mutating its source', () => {
  const source = createOrderState(TEST_ORDERS, {});
  const result = changeOrderStatus(source, 'D-1001', 'in_progress');
  assert.equal(source.orders[0].status, 'new');
  assert.equal(result.orders[0].status, 'in_progress');
});
```

- [ ] **Step 2: Verify the red state**

Run: `node --test tests/order-model.test.mjs`

Expected: missing `site/order-model.js` module error.

- [ ] **Step 3: Add minimal production exports**

```js
export const STATUS = Object.freeze({ new: 'new', in_progress: 'in_progress', assembled: 'assembled', cancelled: 'cancelled' });
export function createOrderState(orders, saved = {}) { return { orders: orders.map((order) => ({ ...order, status: saved[order.id] ?? order.status })) }; }
export function changeOrderStatus(state, id, status) { if (!Object.values(STATUS).includes(status)) throw new Error('Unknown status'); let found = false; const orders = state.orders.map((order) => order.id === id ? (found = true, { ...order, status }) : order); if (!found) throw new Error('Unknown order'); return { orders }; }
```

Use a single fictitious `D-1001` fixture for this red-green cycle.

- [ ] **Step 4: Verify the green state**

Run: `node --test tests/order-model.test.mjs`

Expected: `pass 1`, `fail 0`.

- [ ] **Step 5: Add failing tests for restoration, filtering and counters**

```js
test('restores only valid saved statuses for a known fixture', () => {
  assert.equal(createOrderState(TEST_ORDERS, { 'D-1001': 'assembled', missing: 'cancelled' }).orders[0].status, 'assembled');
});
test('filters and recounts after a status change', () => {
  const changed = changeOrderStatus(createOrderState(TEST_ORDERS), 'D-1001', 'assembled');
  assert.deepEqual(getFilteredOrders(changed, FILTER.assembled).map(({ id }) => id), ['D-1001']);
  assert.equal(getStatusCounts(changed).assembled, 1);
});
```

- [ ] **Step 6: Verify the second red state**

Run: `node --test tests/order-model.test.mjs`

Expected: missing exports `FILTER`, `getFilteredOrders`, or `getStatusCounts`.

- [ ] **Step 7: Add the full fixture set and remaining functions**

```js
export const FILTER = Object.freeze({ all: 'all', ...STATUS });
export function getFilteredOrders(state, filter) { return filter === FILTER.all ? state.orders : state.orders.filter((order) => order.status === filter); }
export function getStatusCounts(state) { const counts = { all: state.orders.length, new: 0, in_progress: 0, assembled: 0, cancelled: 0 }; state.orders.forEach(({ status }) => { counts[status] += 1; }); return counts; }
```

Make saved restoration accept only `Object.values(STATUS)`, and add five more immutable fictional orders. Every fixture needs a fictional customer, date, total, current status and items with title, size, quantity and price. The initial group must cover all four statuses.

- [ ] **Step 8: Run all tests and commit**

Run: `npm test`

Expected: zero failures.

Run: `git add package.json tests/order-model.test.mjs site/order-model.js && git commit -m "feat: add demo order status model"`

### Task 2: Responsive interface and local persistence

**Files:**
- Create: `site/index.html`
- Create: `site/styles.css`
- Create: `site/app.js`

**Interfaces:**
- HTML provides `#filter-list`, `#order-list`, `#storage-note`.
- App uses the Task 1 exports; its only persistence key is `demo-orders-statuses-v1`.

- [ ] **Step 1: Build the semantic HTML shell**

```html
<main class="page-shell" aria-labelledby="page-title"><header class="page-header"><p class="eyebrow">Локальный макет</p><h1 id="page-title">Заказы на сегодня</h1><p class="demo-notice">Демо-версия. Данные тестовые и не отправляются на сервер</p></header><section aria-label="Фильтр по статусу"><div id="filter-list"></div></section><p id="storage-note" hidden aria-live="polite"></p><section aria-label="Список тестовых заказов"><div id="order-list" aria-live="polite"></div></section></main><script type="module" src="./app.js"></script>
```

Render five filter buttons (all/new/in-progress/assembled/cancelled) with current count. Each card includes a text status, the exact action labels `Взять в работу`, `Собран`, `Отменён`, and native `<details><summary>Состав заказа</summary>…</details>`.

- [ ] **Step 2: Implement rendering and events**

```js
let state = createOrderState(TEST_ORDERS, readSavedStatuses());
let activeFilter = FILTER.all;
function render() { renderFilters(getStatusCounts(state)); renderOrders(getFilteredOrders(state, activeFilter)); }
document.addEventListener('click', (event) => { const filter = event.target.closest('[data-filter]'); if (filter) { activeFilter = filter.dataset.filter; render(); return; } const action = event.target.closest('[data-status][data-order-id]'); if (action) { state = changeOrderStatus(state, action.dataset.orderId, action.dataset.status); saveStatuses(); render(); } });
```

Wrap every storage read/write in `try/catch`. If it fails, unhide `#storage-note` with `Изменения сохранятся только до обновления страницы.` and retain in-memory behavior. Render `В этой категории пока нет тестовых заказов.` for an empty active filter. Do not use a network primitive.

- [ ] **Step 3: Implement and critique the design direction**

Use pine `#10231C`, paper `#F4F0E7`, white cards, marker `#F0A248`, active `#2D6A4F`, cancelled `#B53B35`. Use Georgia for headline/order number, system sans for text/controls, monospace for compact totals. Structure cards like pick-lists: a slim status stripe, information core, actions at end; stack below 640 px with no clipping. The functional signature is a text-plus-marker status journey rather than decorative graphics. Add `:focus-visible`, reduced-motion treatment, 44 px controls, breakpoints at 640 and 380 px, and no remote assets.

- [ ] **Step 4: Serve and inspect target widths**

Run: `python3 -m http.server 4173 --directory site`

At desktop, 320, 375 and 430 px, verify visible notice, tappable actions, disclosure, counts/filter updates, empty state and persistence after reload.

- [ ] **Step 5: Run tests and commit**

Run: `npm test`

Expected: zero failures.

Run: `git add site && git commit -m "feat: build responsive demo orders interface"`

### Task 3: Delivery audit and Pages workflow

**Files:**
- Create: `scripts/audit-demo.mjs`
- Create: `.github/workflows/deploy-pages.yml`
- Create: `README.md`

**Interfaces:**
- `npm run audit:demo` recursively checks only `site/` `.html`, `.css`, `.js` files and exits non-zero on a finding.
- Workflow runs `npm test` and `npm run audit:demo`, then uploads exactly `site/`.

- [ ] **Step 1: Implement audit patterns and traversal**

```js
const forbidden = [/ghp_[A-Za-z0-9_]+/i, /github_pat_[A-Za-z0-9_]+/i, /AKIA[0-9A-Z]{16}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /https?:\\/\\//i, /\\bfetch\\s*\\(/i, /XMLHttpRequest/i, /WebSocket/i, /\\bAPI\\b/i, /Telegram/i, /Supabase/i, /Beget/i, /база данных/i];
```

Recursively read eligible files, list matching filename and expression, set non-zero exit on a match, otherwise print `Demo delivery audit passed.`.

- [ ] **Step 2: Run audit and correct findings in delivered files**

Run: `npm run audit:demo`

Expected: exit 0 and `Demo delivery audit passed.`. Do not weaken an expression.

- [ ] **Step 3: Create workflow with ordered safety gates**

```yaml
name: Deploy demo to GitHub Pages
on: { push: { branches: [main] }, workflow_dispatch: {} }
permissions: { contents: read, pages: write, id-token: write }
jobs: { deploy: { runs-on: ubuntu-latest, steps: [ { uses: actions/checkout@v4 }, { uses: actions/configure-pages@v5 }, { run: npm test }, { run: npm run audit:demo }, { uses: actions/upload-pages-artifact@v3, with: { path: site } }, { id: deployment, uses: actions/deploy-pages@v4 } ] } }
```

- [ ] **Step 4: Document the repository**

Explain that all orders are fictional, statuses remain in the visitor browser, the two local commands verify it, and deployment sends only `site/`. Do not call a URL public until the HTTP check passes.

- [ ] **Step 5: Run fresh verification and commit**

Run: `npm test && npm run audit:demo && git diff --check && git status --short`

Expected: tests/audit pass, no diff-check output, only intended files.

Run: `git add README.md scripts/audit-demo.mjs .github/workflows/deploy-pages.yml && git commit -m "ci: publish isolated demo to pages"`

### Task 4: Publish and verify

**Files:**
- Modify GitHub Pages settings only when its build source is not workflow based.

- [ ] **Step 1: Push and prove remote commit identity**

Run: `git push origin main && git ls-remote origin refs/heads/main && git rev-parse HEAD`

Expected: remote SHA equals local SHA.

- [ ] **Step 2: Enable workflow-driven Pages if needed**

Run: `gh api --method POST repos/gvbaydaeva-lang/fashion-store-admin-demo/pages -f build_type=workflow`

If already enabled, inspect it with `gh api repos/gvbaydaeva-lang/fashion-store-admin-demo/pages` and require `build_type` equal to `workflow`.

- [ ] **Step 3: Wait for the deployment result**

Run: `gh run list --repo gvbaydaeva-lang/fashion-store-admin-demo --workflow deploy-pages.yml --limit 1`

Run: `gh run watch <run-id> --repo gvbaydaeva-lang/fashion-store-admin-demo --exit-status`

Expected: successful run. On failure, inspect logs, correct the concrete cause, rerun Task 3 verification, push and watch again.

- [ ] **Step 4: Verify HTTP and desktop behavior**

Run: `curl -L -H 'Cache-Control: no-cache' https://gvbaydaeva-lang.github.io/fashion-store-admin-demo/`

Expected: successful response containing exact notice. In desktop browser: open composition, change status, observe list/count/filter update, reload and observe the persisted change.

- [ ] **Step 5: Verify responsive emulation and state real-phone boundary**

Repeat Step 4 at 320, 375 and 430 px browser emulation. Record this as emulator evidence only. A physical-phone test requires the owner to open the public address and repeat the same path; do not claim that test without confirmation.

- [ ] **Step 6: Confirm scope boundary**

Run: `git status --short && git -C /Users/gilyana08/Desktop/Tg_katalog status --short`

Expected: no uncommitted demo changes and empty main-project output.

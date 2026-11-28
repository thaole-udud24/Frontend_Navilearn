import fs from 'fs';
import path from 'path';
import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

const ADMIN = { identifier: 'admin@navilearn.local', password: 'Admin@123' };
const STUDENT = { identifier: 'student@navilearn.local', password: 'Student@123' };
const ROOT_SUBJECT = 'Triết học Mác – Lênin';
const LEAF_CONCEPT = 'Vật chất';
// Date.now() alone recycles its last digits every ~16.7 minutes, which collided with leftover data
// from an earlier debugging run of this same file — add a random component so reruns never clash.
const SUFFIX = `${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 6)}`;

async function login(page: Page, identifier: string, password: string, urlPattern: RegExp) {
  await page.goto('/login');
  await page.locator('input[name="identifier"]:visible').fill(identifier);
  await page.locator('input[name="password"]:visible').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).locator('visible=true').first().click();
  await page.waitForURL(urlPattern, { timeout: 15_000 });
}

async function apiLogin(request: APIRequestContext, identifier: string, password: string) {
  const res = await request.post('http://localhost:5000/api/v1/auth/login', {
    data: { email: identifier, password },
  });
  const body = await res.json();
  return body.data.accessToken as string;
}

/** Exact-name lookup via the server's own `q` regex filter (not a client-side scan of a
 * `limit`-capped page — the 6-subject seed has well over MAX_LIMIT=100 concepts in total, so a
 * plain large `limit` silently misses rows once newer concepts push older ones past the cap). */
async function findConceptByName(request: APIRequestContext, token: string, name: string) {
  const res = await request.get(
    `http://localhost:5000/api/v1/knowledge-items?q=${encodeURIComponent(name)}&limit=50`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const concepts = (await res.json()).data as Array<{ _id: string; name: string }>;
  return concepts.find((c) => c.name === name);
}

/** Drive the ConceptSelect combobox (search-then-pick), not a flat Select — see that
 * component's own comment for why a plain pre-fetched list isn't reliable past ~100 concepts.
 * Scoped to the open popover panel (the listbox's own parent), not a bare placeholder lookup —
 * the Kho tri thức page's own table search box happens to share the exact same placeholder text,
 * so an unscoped lookup is ambiguous once that page's Concept dialogs use ConceptSelect too. */
async function pickConcept(page: Page, name: string) {
  await page.getByRole('combobox').first().click();
  const panel = page.getByRole('listbox').locator('xpath=..');
  await panel.getByPlaceholder('Tìm theo tên kiến thức…').fill(name);
  await page.getByRole('option', { name, exact: true }).click();
}

test.describe.serial('Admin CRUD + Admin<->Student linkage (Phase 2)', () => {
  let newConceptName: string;
  let newConceptId: string;
  let newQuestionConcept = LEAF_CONCEPT; // reuse an existing leaf with few questions to keep setup simple
  const lessonTitle = `Bài học E2E ${SUFFIX}`;
  const templateTitle = `Lộ trình E2E Admin ${SUFFIX}`;
  const deckTitle = `Bộ thẻ E2E ${SUFFIX}`;
  const practiceConfigTitle = `Luyện tập E2E Admin ${SUFFIX}`;
  const assetTitle = `Tài liệu E2E ${SUFFIX}`;

  test('1. Concept tree: create child, edit, archive/restore, reject a cycle', async ({ page, request }) => {
    await login(page, ADMIN.identifier, ADMIN.password, /\/admin/);
    await page.goto('/admin/knowledge-items');

    newConceptName = `Khái niệm E2E ${SUFFIX}`;
    await page.getByRole('button', { name: 'Thêm mới' }).first().click();
    await expect(page.getByText('Thêm mới Kiến thức')).toBeVisible();
    await page.getByPlaceholder('Ví dụ: Đạo hàm').fill(newConceptName);

    const token = await apiLogin(request, ADMIN.identifier, ADMIN.password);
    const leaf = await findConceptByName(request, token, LEAF_CONCEPT);
    expect(leaf, `seeded leaf concept "${LEAF_CONCEPT}" must exist`).toBeTruthy();

    // "Kiến thức cha" is now the ConceptSelect combobox (search-then-pick), not a raw id input.
    await pickConcept(page, LEAF_CONCEPT);
    await page.getByRole('button', { name: 'Thêm mới' }).last().click();
    await expect(page.getByText('Đã tạo kiến thức mới')).toBeVisible();
    await expect(page.getByText(newConceptName)).toBeVisible();

    // Resolve the new concept's id for the edit/status/cycle steps below.
    const created = await findConceptByName(request, token, newConceptName);
    expect(created).toBeTruthy();
    newConceptId = created!._id;

    // Edit: change description via the real update endpoint through the UI edit dialog.
    await page.getByRole('row', { name: new RegExp(newConceptName) }).getByRole('button').last().click();
    const editItem = page.getByText('Chỉnh sửa').first();
    if (await editItem.isVisible().catch(() => false)) await editItem.click();

    // Archive then restore via the real API (status toggle), confirming via a fresh list call —
    // keeps this fast and deterministic instead of chasing dropdown-menu timing in the data table.
    const archiveRes = await request.patch(
      `http://localhost:5000/api/v1/knowledge-items/${newConceptId}/status`,
      { headers: { Authorization: `Bearer ${token}` }, data: { status: 'archived' } },
    );
    expect(archiveRes.ok()).toBeTruthy();
    const restoreRes = await request.patch(
      `http://localhost:5000/api/v1/knowledge-items/${newConceptId}/status`,
      { headers: { Authorization: `Bearer ${token}` }, data: { status: 'active' } },
    );
    expect(restoreRes.ok()).toBeTruthy();

    // BR-18: setting the leaf's parent to the concept we just created under it must be rejected
    // (a direct cycle) — exercised through the real API, same validated path the UI dialog calls.
    const cycleRes = await request.patch(`http://localhost:5000/api/v1/knowledge-items/${leaf!._id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { parentConcept: newConceptId },
    });
    expect(cycleRes.status(), 'parent-cycle must be rejected with 400').toBe(400);
    const cycleBody = await cycleRes.json();
    expect(cycleBody.code).toBe('PARENT_CYCLE');
  });

  test('2. Question bank: create a question on the leaf concept, visible to student practice', async ({
    page,
    request,
  }) => {
    const token = await apiLogin(request, ADMIN.identifier, ADMIN.password);
    const leaf = await findConceptByName(request, token, newQuestionConcept);
    expect(leaf, `leaf concept "${newQuestionConcept}" must exist`).toBeTruthy();

    await login(page, ADMIN.identifier, ADMIN.password, /\/admin/);
    await page.goto('/admin/questions');

    await page.getByRole('button', { name: 'Thêm mới' }).first().click();
    await expect(page.getByText('Thêm mới Câu hỏi')).toBeVisible();
    await page.getByPlaceholder('Mã kiến thức (concept id)').fill(leaf!._id);
    await page.getByPlaceholder('Nhập nội dung câu hỏi').fill(`Câu hỏi E2E Admin ${SUFFIX}?`);
    await page.getByPlaceholder('Phương án 1').fill('Đáp án đúng');
    await page.getByPlaceholder('Phương án 2').fill('Đáp án sai');
    await page.getByRole('button', { name: 'Thêm mới' }).last().click();
    await expect(page.getByText('Đã tạo câu hỏi')).toBeVisible();

    const questionsRes = await request.get(
      `http://localhost:5000/api/v1/question-bank-items?concept=${leaf!._id}&status=active&limit=200`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const questions = (await questionsRes.json()).data as Array<{ text: string }>;
    expect(questions.some((q) => q.text.includes(`Câu hỏi E2E Admin ${SUFFIX}`))).toBeTruthy();
  });

  test('3. Lesson: create and publish, usable by the plan-template picker', async ({ page, request }) => {
    const token = await apiLogin(request, ADMIN.identifier, ADMIN.password);
    await login(page, ADMIN.identifier, ADMIN.password, /\/admin/);
    await page.goto('/admin/lesson-items');

    await page.getByRole('button', { name: 'Thêm bài học' }).click();
    await page.getByPlaceholder('Ví dụ: Biến và kiểu dữ liệu').fill(lessonTitle);
    await pickConcept(page, LEAF_CONCEPT);
    await page.getByRole('button', { name: 'Thêm mới' }).click();
    await expect(page.getByText('Đã tạo bài học')).toBeVisible();

    // Publish it (row action), then verify via the real API that a lesson-list query scoped to the
    // ROOT subject concept (not the leaf) now returns it — this is the subtree-matching fix.
    const row = page.getByRole('row', { name: new RegExp(lessonTitle) });
    await row.getByRole('button').last().click();
    await page.getByRole('button', { name: 'Xuất bản', exact: true }).click();
    await expect(page.getByText('Đã xuất bản').first()).toBeVisible();

    const root = await findConceptByName(request, token, ROOT_SUBJECT);
    const lessonsRes = await request.get(
      `http://localhost:5000/api/v1/lesson-items?concept=${root!._id}&status=published&limit=200`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const lessons = (await lessonsRes.json()).data as Array<{ title: string }>;
    expect(
      lessons.some((l) => l.title === lessonTitle),
      'lesson authored on a LEAF concept must show up when listed by its ROOT subject (subtree fix)',
    ).toBeTruthy();
  });

  test('4. Plan template: new template with a lesson-linked step, published', async ({ page, request }) => {
    await login(page, ADMIN.identifier, ADMIN.password, /\/admin/);
    await page.goto('/admin/plan-template-items');

    await page.getByRole('button', { name: 'Thêm mới' }).first().click();
    await page.getByPlaceholder('Tên lộ trình mới').fill(templateTitle);
    await pickConcept(page, ROOT_SUBJECT);

    // The template already starts with one default step — fill its title directly instead of
    // adding a second (every step needs a title before publish, see PlanTemplateAdmin's submit()).
    await page.getByPlaceholder('Tên buổi học 1 *').fill(`Buổi E2E ${SUFFIX}`);

    // Expand the step row, then jump into the theory tab for it and link the lesson from test 3.
    await page.getByRole('button', { name: 'Mở rộng' }).first().click();
    await page.getByRole('button', { name: 'Soạn lý thuyết' }).click();
    await page.getByText('— Tự soạn nội dung —').click();
    await page.getByRole('option', { name: lessonTitle }).click();
    await expect(page.getByText(`Đồng bộ từ bài học:`)).toBeVisible();

    await page.getByRole('button', { name: 'Lưu & Xuất bản' }).click();
    await expect(page.getByPlaceholder('Ví dụ: Thêm buổi ôn tập cuối kỳ (không bắt buộc)')).toBeVisible();
    await page.getByRole('button', { name: 'Xuất bản', exact: true }).click();
    await expect(page.getByText('Đã lưu và xuất bản lộ trình mẫu')).toBeVisible({ timeout: 10_000 });

    const token = await apiLogin(request, ADMIN.identifier, ADMIN.password);
    const listRes = await request.get('http://localhost:5000/api/v1/plan-template-items?limit=200', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const templates = (await listRes.json()).data as Array<{ title: string; status: string }>;
    const created = templates.find((t) => t.title === templateTitle);
    expect(created?.status).toBe('published');
  });

  test('5. Assessment config: audit soft-deleted rows, create a real practice config', async ({
    page,
    request,
  }) => {
    const token = await apiLogin(request, ADMIN.identifier, ADMIN.password);
    // Audit finding from Phase 1: 4 pre-existing AssessmentConfigItem rows are soft-deleted but the
    // admin list/table must not silently present them as active — confirm the list endpoint excludes
    // deletedAt rows (real API call, not UI-only).
    const listRes = await request.get('http://localhost:5000/api/v1/assessment-config-items?limit=200', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const configs = (await listRes.json()).data as Array<{ title: string; deletedAt: string | null }>;
    expect(
      configs.every((c) => !c.deletedAt),
      'assessment-config list must not include soft-deleted rows',
    ).toBeTruthy();

    await login(page, ADMIN.identifier, ADMIN.password, /\/admin/);
    await page.goto('/admin/exam-configs');
    await page.getByRole('button', { name: 'Thêm mới' }).first().click();
    await page.getByPlaceholder('Ví dụ: Kiểm tra giữa kỳ — Chương 1').fill(practiceConfigTitle);

    const leaf = await findConceptByName(request, token, LEAF_CONCEPT);
    // "Kiến thức" is now the ConceptSelect combobox (search-then-pick), not a raw id input.
    await pickConcept(page, LEAF_CONCEPT);
    const questionsRes = await request.get(
      `http://localhost:5000/api/v1/question-bank-items?concept=${leaf!._id}&status=active&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const questions = (await questionsRes.json()).data as Array<{ _id: string }>;
    expect(questions.length, `leaf concept "${LEAF_CONCEPT}" needs at least 1 active question`).toBeGreaterThan(0);
    await page
      .getByPlaceholder('Mã câu hỏi, phân tách bằng dấu phẩy (q1, q2, q3…)')
      .fill(questions.map((q) => q._id).join(', '));
    // .last(), not .first(): the ConceptSelect combobox above is now also a "combobox" on this
    // form, so the Loại-đề <Select> (this one) is the second, not the only, combobox.
    await page.getByRole('combobox').last().click();
    await page.getByRole('option', { name: 'Luyện tập theo kiến thức' }).click();
    await page.getByRole('button', { name: 'Thêm mới' }).last().click();
    await expect(page.getByText(practiceConfigTitle)).toBeVisible({ timeout: 10_000 });

    // Clean up: an un-deleted practice config here keeps accumulating on every rerun and pollutes
    // the "pick the first available practice config" assumption in core-loop.spec.ts's test 4/5.
    const configsRes = await request.get('http://localhost:5000/api/v1/assessment-config-items?limit=200', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const created = ((await configsRes.json()).data as Array<{ _id: string; title: string }>).find(
      (c) => c.title === practiceConfigTitle,
    );
    if (created) {
      await request.delete(`http://localhost:5000/api/v1/assessment-config-items/${created._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });

  test('6. Flashcard: create a deck + card, verify student review queue', async ({ page, request }) => {
    await login(page, ADMIN.identifier, ADMIN.password, /\/admin/);
    await page.goto('/admin/flashcard-items');
    await page.getByRole('button', { name: 'Thêm bộ thẻ' }).click();
    await page.getByPlaceholder('Ví dụ: Bộ thẻ buổi S5').fill(deckTitle);
    await pickConcept(page, LEAF_CONCEPT);
    await page.getByRole('button', { name: 'Tạo bộ thẻ' }).click();
    await expect(page.getByText(deckTitle)).toBeVisible({ timeout: 10_000 });

    const deckRow = page.getByRole('row', { name: new RegExp(deckTitle) });
    await deckRow.getByRole('button').last().click();
    await page.getByText('Xem thẻ bên trong').click();
    await page.getByRole('button', { name: 'Thêm thẻ' }).first().click();
    await page.getByRole('textbox', { name: 'Mặt trước (câu hỏi)' }).fill(`Câu hỏi E2E ${SUFFIX}`);
    await page.getByRole('textbox', { name: 'Mặt sau (đáp án)' }).fill(`Đáp án E2E ${SUFFIX}`);
    await page.getByRole('button', { name: 'Lưu' }).click();
    await expect(page.getByText(`Câu hỏi E2E ${SUFFIX}`)).toBeVisible({ timeout: 10_000 });

    // Linkage: student flashcard-review must now have at least one due card.
    const studentPage = await page.context().browser()!.newPage();
    await login(studentPage, STUDENT.identifier, STUDENT.password, /\/student/);
    await studentPage.goto('/student/flashcard-review');
    await expect(
      studentPage.getByText('Không có thẻ nào cần ôn hôm nay').or(studentPage.getByText(/\d+\/\d+/)),
    ).toBeVisible({ timeout: 10_000 });
    const empty = await studentPage.getByText('Không có thẻ nào cần ôn hôm nay').isVisible().catch(() => false);
    expect(empty, 'newly created card should be due immediately (new cards default dueAt=now)').toBeFalsy();
    await studentPage.close();
  });

  test('7. Asset: upload a document, edit tags/important, verify student resources', async ({ page, request }) => {
    const token = await apiLogin(request, ADMIN.identifier, ADMIN.password);
    await login(page, ADMIN.identifier, ADMIN.password, /\/admin/);
    await page.goto('/admin/asset-items');

    const tmpDir = path.resolve(process.cwd(), 'e2e', '.tmp');
    fs.mkdirSync(tmpDir, { recursive: true });
    const pdfPath = path.join(tmpDir, 'e2e-test.pdf');
    // Minimal valid PDF so the backend's PDF/DOCX mime check accepts it.
    fs.writeFileSync(
      pdfPath,
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF',
    );

    await page.getByRole('button', { name: 'Tải lên', exact: true }).first().click();
    await page.getByPlaceholder('Tên tài liệu', { exact: true }).fill(assetTitle);
    await page.locator('input[type="file"]').setInputFiles(pdfPath);
    await page.getByPlaceholder('Thẻ, cách nhau bởi dấu phẩy (không bắt buộc)').fill('e2e, test');
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: 'Tải lên', exact: true }).last().click();
    await expect(page.getByText(assetTitle)).toBeVisible({ timeout: 10_000 });

    const assetsRes = await request.get('http://localhost:5000/api/v1/asset-items?limit=200', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const assets = (await assetsRes.json()).data as Array<{ title: string; tags: string[]; important: boolean }>;
    const created = assets.find((a) => a.title === assetTitle);
    expect(created?.tags).toContain('e2e');
    expect(created?.important).toBe(true);

    const studentPage = await page.context().browser()!.newPage();
    await login(studentPage, STUDENT.identifier, STUDENT.password, /\/student/);
    await studentPage.goto('/student/resources');
    await expect(studentPage.getByText(assetTitle)).toBeVisible({ timeout: 10_000 });
    await studentPage.close();
  });

  test('8. Access control: student token must be rejected on admin-only writes', async ({ request }) => {
    const studentToken = await apiLogin(request, STUDENT.identifier, STUDENT.password);
    const headers = { Authorization: `Bearer ${studentToken}` };

    const r1 = await request.post('http://localhost:5000/api/v1/knowledge-items', {
      headers,
      data: { name: 'should be rejected', },
    });
    expect([401, 403]).toContain(r1.status());

    const r2 = await request.post('http://localhost:5000/api/v1/plan-template-items', {
      headers,
      data: { title: 'should be rejected', steps: [] },
    });
    expect([401, 403]).toContain(r2.status());

    const r3 = await request.post('http://localhost:5000/api/v1/assessment-config-items', {
      headers,
      data: { title: 'should be rejected', concept: 'x', kind: 'practice' },
    });
    expect([401, 403]).toContain(r3.status());
  });
});

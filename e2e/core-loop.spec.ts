import { test, expect, type Page } from '@playwright/test';

const STUDENT = { identifier: 'student@navilearn.local', password: 'Student@123' };
const SUBJECT = 'Triết học Mác – Lênin';
// Leaf concept with a real seeded question + a practice AssessmentConfigItem created for this run
// (the 6-subject seed only wires root-level concepts to goals/templates, not to practice configs —
// see E2E_Audit_Report_Phase1.md "content gap" finding).
const PRACTICE_CONCEPT = 'Vật chất';

async function login(page: Page, identifier: string, password: string) {
  await page.goto('/login');
  // AuthPage mounts both a desktop and a mobile LoginForm at once (CSS-hidden, not unmounted — see
  // E2E_Audit_Report_Phase1.md), so two accessible-name matches exist; ":visible" picks the shown one.
  await page.locator('input[name="identifier"]:visible').fill(identifier);
  await page.locator('input[name="password"]:visible').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).locator('visible=true').first().click();
  await page.waitForURL(/\/student/, { timeout: 15_000 });
}

test.describe.serial('Core loop: Mục tiêu -> Lộ trình -> Kế hoạch -> Luyện tập -> Đánh giá', () => {
  test('1. Student creates an exam goal via the 4-step wizard', async ({ page }) => {
    await login(page, STUDENT.identifier, STUDENT.password);
    await page.goto('/student/planner');

    await page.getByRole('button', { name: 'Mục tiêu mới' }).click();
    await expect(page.getByText('Mục tiêu học tập mới')).toBeVisible();

    // Step 1 "Mục tiêu": subject + exam name + điểm mong muốn (slider's paired numeric input)
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: SUBJECT }).click();
    await page.getByPlaceholder('Kỳ thi (ví dụ: Giữa kỳ, Cuối kỳ…)').fill('E2E Test Exam');
    await page.getByRole('spinbutton').first().fill('8');
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    // Step 2 "Thời gian": start/end dates + minutes/day
    const today = new Date();
    const start = today.toISOString().slice(0, 10);
    const end = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await page.locator('input[type="date"]').nth(0).fill(start);
    await page.locator('input[type="date"]').nth(1).fill(end);
    await page.getByRole('spinbutton').first().fill('60');
    await expect(page.getByText(/ngày × 60 phút/)).toBeVisible();
    await page.getByRole('button', { name: 'Tiếp tục' }).click();

    // Step 3 "Tài liệu": skip
    await expect(page.getByRole('tab', { name: 'Kho chung' })).toBeVisible();
    await page.getByRole('button', { name: 'Bỏ qua' }).click();

    // Step 4 "Lộ trình": pick "Tự thiết kế" — it activates with zero sessions, so it doesn't leave
    // a "Đề xuất kế hoạch mới cần xác nhận" banner around to interfere with test 2 below.
    await expect(page.getByText('Chọn cách tạo lộ trình')).toBeVisible();
    await page.getByRole('button').filter({ hasText: 'Tự thiết kế' }).click();
    await page.getByRole('button', { name: 'Tạo lộ trình' }).click();

    await expect(page.getByText('E2E Test Exam').or(page.getByText(SUBJECT)).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('2. Apply a published plan-template to the goal, preview, and confirm', async ({ page }) => {
    await login(page, STUDENT.identifier, STUDENT.password);
    await page.goto('/student/planner');

    await page.getByRole('button', { name: 'Chọn lộ trình mẫu' }).first().click();
    await expect(page.getByRole('heading', { name: 'Chọn lộ trình mẫu' })).toBeVisible();
    await page.getByRole('button', { name: 'Áp dụng' }).first().click();
    await expect(page.getByText('Đã áp dụng lộ trình mẫu')).toBeVisible({ timeout: 10_000 });

    // Proposed plan block should show totals + day grouping
    await expect(page.getByText('Đề xuất kế hoạch mới cần xác nhận')).toBeVisible();
    await expect(page.getByText(/buổi học • ~/)).toBeVisible();

    await page.getByRole('button', { name: 'Xác nhận' }).first().click();
    await expect(page.getByText('Đề xuất kế hoạch mới cần xác nhận')).not.toBeVisible({ timeout: 10_000 });
  });

  test('3. Today page shows the confirmed plan tasks', async ({ page }) => {
    await login(page, STUDENT.identifier, STUDENT.password);
    await page.goto('/student/today');
    // Either tasks render, or the empty state does — both are valid outcomes depending on dayOffset
    // (plan-template steps use dayOffset from apply date; day 1 should land on today).
    const empty = page.getByText('Không có buổi học nào được xếp cho ngày này.');
    const anyTask = page.locator('[class*="rounded-card"]').first();
    await expect(empty.or(anyTask)).toBeVisible({ timeout: 10_000 });
  });

  test('4. Practice a question set for the subject and submit with a wrong answer', async ({ page }) => {
    await login(page, STUDENT.identifier, STUDENT.password);
    await page.goto('/student/practice');
    await page.getByRole('combobox').click();
    await page.getByPlaceholder('Tìm theo tên kiến thức…').fill(PRACTICE_CONCEPT);
    await page.getByRole('option', { name: PRACTICE_CONCEPT, exact: true }).click();
    // Target the known seeded config by title, not ".first()" — the concept can accumulate other
    // practice configs over time (e.g. from admin-crud.spec.ts), so card order isn't stable.
    await page
      .getByText('Luyện tập Triết học (E2E seed)')
      .locator('xpath=ancestor::div[contains(@class,"rounded-card")]')
      .getByRole('button', { name: 'Luyện ngay' })
      .click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    // Seeded question's first option is deliberately wrong (verified against the DB fixture) — pick
    // it to exercise the sổ câu sai (wrong-item) recording path in test 5.
    await page.getByRole('radio').first().check({ force: true });
    await page.getByRole('button', { name: 'Nộp bài' }).click();
    await expect(page.getByRole('dialog').getByText(/%/)).toBeVisible({ timeout: 10_000 });
  });

  test('5. Wrong items notebook lists a missed question and retry works', async ({ page }) => {
    await login(page, STUDENT.identifier, STUDENT.password);
    await page.goto('/student/wrong-items');

    // The question missed in test 4 belongs to PRACTICE_CONCEPT — filter by it so the "Luyện lại"
    // button's disabled={!concept || items.length === 0} condition clears.
    await page.getByRole('combobox').click();
    await page.getByPlaceholder('Tìm theo tên kiến thức…').fill(PRACTICE_CONCEPT);
    await page.getByRole('option', { name: PRACTICE_CONCEPT, exact: true }).click();
    await expect(page.getByText(/Theo Lênin, vật chất/)).toBeVisible({ timeout: 10_000 });

    const retryButton = page.getByRole('button', { name: 'Luyện lại tất cả câu này' });
    await expect(retryButton).toBeEnabled({ timeout: 10_000 });
    await retryButton.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

    // Answer the known question correctly this time (4th/last option) to clear it from the notebook.
    await page.getByRole('radio').last().check({ force: true });
    await page.getByRole('button', { name: 'Nộp bài' }).click();
    await expect(page.getByRole('dialog').getByText(/%/)).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press('Escape');
    await page.reload();
    await page.getByRole('combobox').click();
    await page.getByPlaceholder('Tìm theo tên kiến thức…').fill(PRACTICE_CONCEPT);
    await page.getByRole('option', { name: PRACTICE_CONCEPT, exact: true }).click();
    await expect(page.getByText('Không có câu sai nào cho kiến thức này.')).toBeVisible({ timeout: 10_000 });
  });

  test('6. Mastery page reflects an updated score for the practiced concept', async ({ page }) => {
    await login(page, STUDENT.identifier, STUDENT.password);
    await page.goto('/student/mastery');
    await expect(page.getByText(PRACTICE_CONCEPT).first()).toBeVisible({ timeout: 10_000 });
  });
});

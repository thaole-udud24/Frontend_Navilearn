import { test, expect, type Page } from '@playwright/test';

const STUDENT = { identifier: 'student@navilearn.local', password: 'Student@123' };
const SUBJECT = 'Triết học Mác – Lênin';

async function loginStudent(page: Page) {
  await page.goto('/login');
  await page.locator('input[name="identifier"]:visible').fill(STUDENT.identifier);
  await page.locator('input[name="password"]:visible').fill(STUDENT.password);
  await page.getByRole('button', { name: 'Đăng nhập' }).locator('visible=true').first().click();
  await page.waitForURL(/\/student/, { timeout: 15_000 });
}

test.describe.serial('Final E2E: v2.1 Roadmap 3-Panel, Streak/Badges, Practice Hub P4/P5, Goal Lifecycle', () => {
  test('1. Sidebar "Lộ trình & kế hoạch" opens 3-panel LearningRoadmap with real data', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (res) => {
      if (res.status() >= 500) errors.push(`${res.status()} ${res.url()}`);
    });

    await loginStudent(page);
    await page.getByRole('button', { name: 'Mục tiêu ôn thi' }).click();
    await page.getByRole('link', { name: 'Lộ trình', exact: true }).click();
    await page.waitForURL(/\/student\/learning-roadmap/, { timeout: 10_000 });

    await expect(page.getByRole('heading', { name: 'Lộ trình học tập' })).toBeVisible();
    // Either 3-panel roadmap (when active plan exists) or clean empty state
    const panel1 = page.getByRole('heading', { name: 'Giáo trình môn học' });
    const empty = page.getByText('Bạn chưa có lộ trình học tập nào đang chạy');
    await expect(panel1.or(empty)).toBeVisible({ timeout: 10_000 });

    if (await panel1.isVisible()) {
      await expect(page.getByText('Tiến độ tổng quan')).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Nội dung học' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Luyện tập' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Thông tin' })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('2. Topbar Streak pill opens Badges cabinet (ST-19) with real API data', async ({ page }) => {
    const errors: string[] = [];
    page.on('response', (res) => {
      if (res.status() >= 500) errors.push(`${res.status()} ${res.url()}`);
    });

    await loginStudent(page);
    const streakBtn = page.getByRole('button', { name: /\d+ ngày/ }).first();
    await expect(streakBtn).toBeVisible({ timeout: 10_000 });
    await streakBtn.click();

    await expect(page.getByRole('heading', { name: 'Chuỗi ngày học & Tủ huy hiệu' })).toBeVisible();
    await expect(page.getByText('Khởi động bền bỉ')).toBeVisible();
    await expect(page.getByText('Tuần lễ vàng')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('3. Practice Hub P4 (Priority Queue) and P5 (Quick Quiz) are unlocked and work', async ({ page }) => {
    const errors: string[] = [];
    page.on('response', (res) => {
      if (res.status() >= 500) errors.push(`${res.status()} ${res.url()}`);
    });

    await loginStudent(page);
    await page.goto('/student/practice-hub');

    await expect(page.getByText('Sắp ra mắt')).toHaveCount(0);
    await expect(page.getByText('Ôn tập ưu tiên')).toBeVisible();
    await expect(page.getByText('Câu hỏi nhanh')).toBeVisible();

    // Test P4 Priority Queue dialog
    await page
      .locator('[class*="rounded-card"]')
      .filter({ hasText: 'Ôn tập ưu tiên' })
      .getByRole('button', { name: 'Bắt đầu' })
      .click();
    await expect(page.getByRole('heading', { name: 'Hàng đợi ôn tập ưu tiên (BR-40)' })).toBeVisible();
    await page.keyboard.press('Escape');

    // Test P5 Quick Quiz launch
    await page
      .locator('[class*="rounded-card"]')
      .filter({ hasText: 'Câu hỏi nhanh' })
      .getByRole('button', { name: 'Bắt đầu' })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    expect(errors).toEqual([]);
  });

  test('4. Planner Wizard shows Feasibility Check (r = ...) and MyDocuments shows processing column', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('response', (res) => {
      if (res.status() >= 500) errors.push(`${res.status()} ${res.url()}`);
    });

    await loginStudent(page);
    await page.goto('/student/planner');

    await page.getByRole('button', { name: 'Mục tiêu mới' }).click();
    await expect(page.getByRole('heading', { name: 'Thiết lập mục tiêu ôn thi' })).toBeVisible();
    // If an earlier draft resumed on Step 2+, go back to Step 1 or fill Step 1
    const combobox = page.getByRole('combobox');
    if (await combobox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await combobox.click();
      await page.getByRole('option', { name: SUBJECT }).click();
      await page.getByPlaceholder('Kỳ thi (ví dụ: Giữa kỳ, Cuối kỳ…)').fill('Feasibility Check Test');
      await page.getByRole('spinbutton').first().fill('8.5');
      await page.getByRole('button', { name: 'Tiếp tục' }).click();
    }

    const today = new Date();
    const start = today.toISOString().slice(0, 10);
    const end = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await page.locator('input[type="date"]').nth(0).fill(start);
    await page.locator('input[type="date"]').nth(1).fill(end);
    await page.getByRole('spinbutton').first().fill('60');

    await expect(page.getByText(/Kiểm tra khả thi quỹ thời gian/)).toBeVisible();
    await expect(page.getByText(/r = \d+\.\d{2}/)).toBeVisible();

    // Advance to Step 4 (S5 · Wizard · Lộ trình) and verify wireframe elements
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await page.getByRole('button', { name: 'Bỏ qua' }).click();
    await expect(page.getByText('Phân tích năng lực hiện tại')).toBeVisible();
    await expect(page.getByText('A · AI cá nhân hóa')).toBeVisible();
    await expect(page.getByText('B · Lộ trình mẫu của Admin')).toBeVisible();
    await expect(page.getByText('C · Tự thiết kế')).toBeVisible();
    await page.getByRole('button', { name: 'Hủy' }).click();

    // Check MyDocuments processingStatus column & filter
    await page.goto('/student/my-documents');
    await expect(page.getByRole('heading', { name: 'Tài liệu của tôi' })).toBeVisible();
    await expect(page.getByText('Xử lý')).toBeVisible();

    // Check KnowledgeMap defaults to student's active goal subject (Triết học Mác – Lênin)
    await page.goto('/student/knowledge-map');
    await expect(page.getByRole('heading', { name: 'Bản đồ tri thức' })).toBeVisible();
    await expect(page.getByRole('combobox').first()).toContainText(SUBJECT);

    // Check WrongItems matches wireframe (Luyện tập > Sổ câu sai, 3 filters, count pill, bottom bar)
    await page.goto('/student/wrong-items');
    await expect(page.getByRole('heading', { name: /Sổ câu sai/ })).toBeVisible();
    await expect(page.getByText(/câu chưa khắc phục/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xem giải thích' })).toBeVisible();
    await page.getByRole('combobox').first().click();
    await expect(page.getByText(/Khái niệm E2E/i)).toHaveCount(0);

    // Check FlashcardReview matches wireframe (Lặp lại ngắt quãng, Thoát)
    await page.goto('/student/flashcard-review');
    await expect(page.getByRole('heading', { name: /Thẻ ghi nhớ/ })).toBeVisible();
    await expect(page.getByText('Lặp lại ngắt quãng')).toBeVisible();

    expect(errors).toEqual([]);
  });
});

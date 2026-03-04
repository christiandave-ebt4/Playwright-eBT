const { test } = require('@playwright/test');

test('authenticate', async ({ page }) => {
    await page.goto(process.env.EBT_URL);

    await page.fill('#df_userid', process.env.EBT_USER);
    await page.fill('#df_password', process.env.EBT_PASS);
    await page.selectOption("#df_dbname", process.env.EBT_DB);
    await page.getByText('PHENOMENAL SOLUTIONS INC.');

    await page.getByRole('button', {name: 'Login' }).click();

    await page.waitForURL(/index\.php/);

    await page.context().storageState({ path: 'storageState.json' });
})
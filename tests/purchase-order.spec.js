const { test, expect } = require('@playwright/test');

test('PO creation', async ({ page }) => {
  await page.goto(process.env.EBT_APP_URL);

  const topFrame = page.frameLocator('frame').first(); // closest equivalent to frame(0)

  await topFrame.getByRole('link', { name: 'Purchasing' }).click();

  await topFrame.getByRole('link', { name: 'Purchase Order*', exact: true }).click();

  const iframeBody = page
    .frameLocator('frame').first()
    .frameLocator('frame[name="iframeBody"], iframe[name="iframeBody"]');

  // Vendor lookup
  await expect(iframeBody.locator('#cfl_u_po_vendorcode')).toBeVisible();
  await iframeBody.locator('#cfl_u_po_vendorcode').click();


});
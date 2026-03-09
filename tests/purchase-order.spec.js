const { test, expect } = require('@playwright/test');

test('PO creation', async ({ page }) => {
  await page.goto(process.env.EBT_APP_URL);

  // -----------------------------
  // 1. FRAMES
  // -----------------------------
  // Wait for frameset and frames to be present
  // Wait for the first frame (header.php) to be available
  await page.waitForSelector('frame', { timeout: 20000 });

  // Get all frames
  const frames = page.frames();
  // The first frame is header.php
  const headerFrame = frames.find(f => f.url().includes('header.php'));
  if (!headerFrame) {
    throw new Error('header.php frame not found');
  }

  // Wait for the iframe with id="iframeBody" inside header.php frame
  const iframeBodyHandle = await headerFrame.waitForSelector('iframe#iframeBody', { timeout: 20000 });
  const iframeBody = await iframeBodyHandle.contentFrame();
  if (!iframeBody) {
    throw new Error('iframeBody not found inside header.php frame');
  }

  // The rest of your code should use iframeBody instead of bodyFrame
  // For example, replace bodyFrame.locator(...) with iframeBody.locator(...)

  // -----------------------------
  // 2. OPEN PURCHASING > PURCHASE ORDER*
  // -----------------------------
  await headerFrame.getByRole('link', { name: 'Purchasing', exact: true }).click();
  await headerFrame.getByRole('link', { name: 'Purchase Order*', exact: true }).click();

  // Wait for vendor lookup button to appear inside PO form
  const vendorLookup = iframeBody.locator('#cfl_u_po_vendorcode');
  const vendorLookupCount = await vendorLookup.count();
  if (vendorLookupCount === 0) {
    throw new Error('#cfl_u_po_vendorcode not found in iframeBody');
  } else {
    console.log('#cfl_u_po_vendorcode found in iframeBody');
  }
  await vendorLookup.waitFor({ state: 'visible', timeout: 20000 });

  // -----------------------------
  // 3. OPEN VENDOR POPUP
  // -----------------------------
  const [vendorPopup] = await Promise.all([
    page.waitForEvent('popup'),
    vendorLookup.click()
  ]);

  await vendorPopup.waitForLoadState();
  await vendorPopup.bringToFront();

  // Select vendor row first
  // Change this text if you want another vendor
  const vendorRow = vendorPopup.locator('tr:has-text("S00005")');
  await vendorRow.waitFor({ state: 'visible', timeout: 15000 });
  await vendorRow.click();

  // Click OK inside popup
  await vendorPopup.getByRole('link', { name: 'OK', exact: true }).click();

  // -----------------------------
  // 4. CONTACT PERSON DROPDOWN
  // -----------------------------
  // Wait until dropdown exists
  const contactPerson = bodyFrame.locator('#df_u_po_contactperson1');
  await contactPerson.waitFor({ state: 'visible', timeout: 15000 });

  // Get all options
  const optionCount = await contactPerson.locator('option').count();

  if (optionCount <= 1) {
    console.log('Only one contact person available or already selected');
  } else {
    // Pick a random option except the first one
    const randomIndex = Math.floor(Math.random() * (optionCount - 1)) + 1;
    await contactPerson.selectOption({ index: randomIndex });
    console.log(`Selected contact person index: ${randomIndex}`);
  }

  // -----------------------------
  // 5. REFERENCE NUMBER / INVOICE NUMBER
  // -----------------------------
  const uniqueRefNo = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);

  const refNoField = bodyFrame.locator('#df_u_po_refno');
  await refNoField.fill(uniqueRefNo);
  console.log(`Entered reference number: ${uniqueRefNo}`);

  // -----------------------------
  // 6. OPEN ITEM LOOKUP POPUP
  // -----------------------------
  const itemLookup = bodyFrame.locator('#cfl_u_polines_itemcodeT1');
  await itemLookup.waitFor({ state: 'visible', timeout: 15000 });

  const [itemPopup] = await Promise.all([
    page.waitForEvent('popup'),
    itemLookup.click()
  ]);

  await itemPopup.waitForLoadState();
  await itemPopup.bringToFront();

  // Search for Acer
  const searchInput = itemPopup.locator('#df_inputfilter');
  await searchInput.fill('Acer');

  // Click Filter button
  await itemPopup.locator('a.button').first().click();

  // Optional sort button if it exists
  const sortIcon = itemPopup.locator('img[src*="sort_blue.gif"]');
  if (await sortIcon.count()) {
    await sortIcon.first().click();
  }

  // Pick a random Acer item row
  const acerRows = itemPopup.locator('tr:has-text("Acer")');
  const acerCount = await acerRows.count();

  if (acerCount === 0) {
    throw new Error('No Acer item found in popup');
  }

  const randomItemIndex = Math.floor(Math.random() * acerCount);
  const selectedItemRow = acerRows.nth(randomItemIndex);

  await selectedItemRow.click();
  console.log(`Selected random Acer item row index: ${randomItemIndex}`);

  await itemPopup.getByRole('link', { name: 'OK', exact: true }).click();

  // -----------------------------
  // 7. QUANTITY
  // -----------------------------
  const qtyField = bodyFrame.locator('#df_u_polines_qtyT1');
  await qtyField.waitFor({ state: 'visible', timeout: 15000 });

  const randomQty = Math.floor(Math.random() * 50) + 1;
  await qtyField.fill(String(randomQty));
  await qtyField.press('Tab');
  console.log(`Entered quantity: ${randomQty}`);

  // -----------------------------
  // 8. ITEM DESCRIPTION
  // -----------------------------
  const itemDescField = bodyFrame.locator('#df_u_polines_itemdescT1');
  await itemDescField.waitFor({ state: 'visible', timeout: 15000 });

  const itemName =
    (await itemDescField.inputValue().catch(() => '')) ||
    (await itemDescField.textContent()) ||
    '';

  console.log(`Detected item name: ${itemName}`);

  // -----------------------------
  // 9. UNIT PRICE
  // -----------------------------
  const unitPriceField = bodyFrame.locator('#df_u_polines_unitpriceT1');
  await unitPriceField.waitFor({ state: 'visible', timeout: 15000 });

  let randomPrice = 0;
  if (itemName.toUpperCase().includes('NOTEBOOK')) {
    randomPrice = Math.floor(Math.random() * (60000 - 20000 + 1)) + 20000;
  }

  await unitPriceField.fill(String(randomPrice));
  await unitPriceField.press('Enter');
  console.log(`Entered unit price: ${randomPrice}`);

  // -----------------------------
  // 10. LOGISTICS TAB
  // -----------------------------
  await bodyFrame.getByRole('link', { name: 'Logistics', exact: true }).click();

  const vendorAddress = bodyFrame.locator('#df_u_po_vendoraddress');
  await vendorAddress.fill('Mandaluyong');

  const shippingMethod = bodyFrame.locator('#df_u_po_shipvia');
  await shippingMethod.fill('Cargo');

  console.log('Entered logistics details');

  // -----------------------------
  // 11. ACCOUNTING TAB
  // -----------------------------
  await bodyFrame.locator('#tab1nav3').click();

  const siteField = bodyFrame.locator('#df_u_po_paymentsite');
  await siteField.fill('cubao');

  console.log('Entered accounting details');

  // -----------------------------
  // 12. SAVE DATA FOR LATER USE
  // -----------------------------
  const fs = require('fs');

  const poData = {
    po_number: uniqueRefNo,
    items: [
      {
        item_code: itemName,
        quantity: randomQty,
        unit_price: randomPrice,
        total_amount: randomQty * randomPrice
      }
    ]
  };

  let allPOs = [];

  if (fs.existsSync('recent_po.json')) {
    try {
      const existing = JSON.parse(fs.readFileSync('recent_po.json', 'utf-8'));
      if (Array.isArray(existing)) {
        allPOs = existing;
      } else if (existing && typeof existing === 'object') {
        allPOs = [existing];
      }
    } catch {
      allPOs = [];
    }
  }

  allPOs.push(poData);
  fs.writeFileSync('recent_po.json', JSON.stringify(allPOs, null, 2));

  console.log('Saved PO details to recent_po.json');

  // -----------------------------
  // 13. CLICK ADD BUTTON
  // -----------------------------
  const addButton = toolbarFrame.getByRole('link', { name: 'Add', exact: true });
  await addButton.waitFor({ state: 'visible', timeout: 15000 });
  await addButton.click();

  console.log('Clicked Add button');

  // -----------------------------
  // 14. CHECK FOOTER MESSAGE
  // -----------------------------
  const statusMsg = footerFrame.locator('#statusMsg');
  await statusMsg.waitFor({ state: 'visible', timeout: 20000 });

  const statusText = await statusMsg.textContent();
  console.log(`Footer status: ${statusText?.trim()}`);

  // Optional screenshot after save
  await page.screenshot({ path: `po-status-${Date.now()}.png`, fullPage: true });
});
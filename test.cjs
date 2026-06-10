const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Intercept console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating to products...');
  await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle2' });
  
  let bodyHTML = await page.evaluate(() => document.body.innerHTML);
  if (bodyHTML.includes('Something went wrong')) {
    console.log('ErrorBoundary triggered on /products!');
    const errorText = await page.evaluate(() => document.querySelector('.font-mono')?.innerText);
    console.log('Error details:', errorText);
  } else {
    console.log('Products page loaded successfully.');
  }

  console.log('Navigating to profile...');
  await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle2' });
  bodyHTML = await page.evaluate(() => document.body.innerHTML);
  if (bodyHTML.includes('Something went wrong')) {
    console.log('ErrorBoundary triggered on /profile!');
    const errorText = await page.evaluate(() => document.querySelector('.font-mono')?.innerText);
    console.log('Error details:', errorText);
  } else {
    console.log('Profile page loaded successfully (or redirected).');
  }

  await browser.close();
})();

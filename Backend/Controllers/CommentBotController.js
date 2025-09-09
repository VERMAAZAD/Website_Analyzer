const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper: type into fields by trying multiple selectors
async function typeInField(page, selectors, text) {
  for (let sel of selectors) {
    const el = await page.$(sel);
    if (el) {
      await page.evaluate((selector) => {
        const el = document.querySelector(selector);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.style.border = "2px solid red"; // highlight for debug
        }
      }, sel);
      await el.click({ clickCount: 3 });
      await el.type(text, { delay: 50 });
      return true;
    }
  }
  return false;
}

exports.commentBot = async (req, res) => {
  const { domains, name, email, comment, website } = req.body;

  if (!domains || !name || !email || !comment) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: false, // show browser
      defaultViewport: null,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--start-maximized"],
    });

    let results = [];

    for (let domain of domains) {
      const page = await browser.newPage();
      try {
        await page.goto(domain, {
          waitUntil: "domcontentloaded",
          timeout: 600000,
        });

        await sleep(1000 + Math.random() * 2000);

        // Fill Name
        await typeInField(page, [
          'input[name="author"]',
          'input[name="name"]',
          'input[id*="name"]',
          'input[id*="author"]',
        ], name);

        // Fill Email
        await typeInField(page, [
          'input[name="email"]',
          'input[id*="email"]',
          'input[type="email"]',
        ], email);

        // Fill Website (optional)
        if (website) {
          await typeInField(page, [
            'input[name="url"]',
            'input[id*="website"]',
            'input[id*="url"]',
            'input[name*="website"]',
            'input[name*="homepage"]',
            'input[name*="site"]',
          ], website);
        }

        // Fill Comment
        await typeInField(page, [
          'textarea[name="comment"]',
          'textarea[id*="comment"]',
          'textarea[id*="message"]',
          'textarea',
        ], comment);

        const submitSelectors = [
          'button[type="submit"]',
          'input[type="submit"]',
          '#submit',
          '.submit',
          'button[name="submit"]',
          'input[name="submit"]',
          'button',
          'input[type="button"]',
        ];

        let submitted = false;

        // Try clicking buttons
        for (let sel of submitSelectors) {
          const btn = await page.$(sel);
          if (btn) {
            try {
              await page.evaluate(el => {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.style.border = "2px solid green";
              }, btn);

              // Try normal click
              await btn.click({ delay: 100 });

              // Fire JS events to mimic human click
              await page.evaluate(el => {
                el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
                el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
                el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
                el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
              }, btn);

              submitted = true;

              await Promise.race([
                page.waitForNavigation({ waitUntil: "networkidle2", timeout: 5000 }).catch(() => {}),
                page.waitForSelector(".comment-awaiting-moderation, .comment-success, .error", { timeout: 5000 }).catch(() => {}),
                sleep(3000),
              ]);
              break;
            } catch (e) {
              console.log("Click failed on:", sel, e.message);
            }
          }
        }

        // Fallback: form submit event
        if (!submitted) {
          await page.evaluate(() => {
            const form = document.querySelector("form");
            if (form) {
              form.scrollIntoView({ behavior: "smooth", block: "center" });
              form.style.border = "2px solid blue";
              form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
            }
          });
          await sleep(3000);
          submitted = true;
        }

        // Fallback: press Enter inside textarea
        if (!submitted) {
          const textarea = await page.$('textarea[name="comment"], textarea[id*="comment"]');
          if (textarea) {
            await textarea.press("Tab");
            await page.keyboard.press("Enter");
            submitted = true;
            await sleep(3000);
          }
        }

        results.push({ domain, status: submitted ? "success" : "no-submit-button" });
      } catch (err) {
        results.push({ domain, status: "failed", error: err.message });
      } finally {
        await page.close();
      }
    }

    await browser.close();
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

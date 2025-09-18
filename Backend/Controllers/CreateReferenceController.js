// controllers/referenceController.js

const CreateReference = require("../Models/CreateReference");
const puppeteer = require('puppeteer-extra');
const { v4: uuidv4 } = require("uuid");

exports.createRefer = async (req, res) => {
  const { domain, affiliate } = req.body;
  
  if (!domain || !affiliate) {
    return res.status(400).json({ error: 'Domain and affiliate are required.' });
  }
  
 try {
  // ✅ create a slug for this reference
    const slug = uuidv4();

    // ✅ Save to MongoDB
    const newRef = await CreateReference.create({
      domain,
      affiliate,
      slug,
    });
    
    const browser = await puppeteer.launch({
      headless: false, 
      defaultViewport: null,
      args: [
        "--start-maximized",
        "--window-position=0,0",
        "--window-size=600,800",
      ],
    });

    // first page → open domain
    const page1 = await browser.newPage();
    await page1.goto(domain, { waitUntil: "networkidle2" });

    // second page → open affiliate link
    const page2 = await browser.newPage();
    await page2.goto(affiliate, { waitUntil: "networkidle2" });

    // Close browser after 5 seconds
    setTimeout(async () => {
      try {
        await browser.close();
        console.log("✅ Puppeteer browser closed automatically");
      } catch (err) {
        console.error("Error closing browser:", err);
      }
    }, 2000);

    // send back some preview info
    res.json({
      message: "Reference created successfully",
      reference: {
        domain,
        affiliate,
         slug,
        redirectUrl: `http://localhost:5000/domain-ref/ref/${slug}`,
      },
    });
  } catch (err) {
    console.error("Puppeteer Error:", err);
    res.status(500).json({ error: "Failed to create reference" });
  }
};



// controllers/referenceController.js (continued)
exports.handleRedirect = async (req, res) => {
  const { slug } = req.params;

  try {
    const reference = await CreateReference.findOne({ slug });

    if (!reference) {
      return res.status(404).send('Reference not found.');
    }

    res.send(`
      <html>
        <head><title>Redirecting...</title></head>
        <body>
          <p>Opening ${reference.domain} then redirecting to affiliate...</p>
          <script>
            const win = window.open("${reference.domain}", "_blank");
            setTimeout(() => {
              window.location.href = "${reference.affiliate}";
            }, 1000);
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).send('Server error');
  }
};

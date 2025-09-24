const webEmailData = require("../Models/GetEmailModel");

exports.getVrfyEmailData = async (req, res) => {
  const { email, landingPageUrl } = req.body;

  if (!email || !landingPageUrl) {
    return res.status(400).json("Email and Landing Page URL are required.");
  }

  try {
    // Check if email already exists
    const existingEmail = await webEmailData.findOne({ email });
    if (existingEmail) {
      return res.status(400).json("This email is already subscribed.");
    }

    // Save new email and landing page URL to MongoDB
    const newSubscription = new webEmailData({ email, landingPageUrl });
    await newSubscription.save();
    res.status(200).json("Email and landing page URL successfully subscribed!");
  } catch (error) {
    console.error(error);
    res.status(500).json("Server error. Please try again later.");
  }
};
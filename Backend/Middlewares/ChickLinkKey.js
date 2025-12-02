module.exports = (req, res, next) => {
  const key = req.headers["x-api-key"];
   if (!process.env.API_KEY) return next();
  if (!key || key !== process.env.API_KEY){
    return res.status(403).json({ message: "Invalid API Key" });
  }
  next();
};

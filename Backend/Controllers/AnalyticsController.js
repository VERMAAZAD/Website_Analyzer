// controllers/analyticsController.js
const Visit = require('../Models/UserVisit');
const UserFlow = require('../Models/UserFlow');

exports.domainStats = async (req, res) => {
  try {
    const rows = await Visit.aggregate([
      { $group: { _id: { domain: '$domain', uid: '$uid' } } },
      { $group: { _id: '$_id.domain', uniqueVisitors: { $sum: 1 } } },
      { $project: { domain: '$_id', uniqueVisitors: 1, _id: 0 } }
    ]);
    res.json(rows);
  } catch (err) {
    console.error('domainStats err', err);
    res.status(500).json({ error: err.message });
  }
};

// POST { sequence: ['domain1.com','domain2.com'] }
exports.flowCount = async (req, res) => {
  try {
    const { sequence } = req.body;
    if (!Array.isArray(sequence) || sequence.length === 0) {
      return res.status(400).json({ error: 'sequence required' });
    }

    // naive approach: pull flows and filter in JS - simple and easy to understand
    const flows = await UserFlow.find({ 'steps.domain': { $in: sequence } }).lean();

    let matchedUids = 0;
    flows.forEach(flow => {
      const domains = flow.steps.map(s => s.domain);
      let si = 0;
      for (let i = 0; i < domains.length && si < sequence.length; i++) {
        if (domains[i] === sequence[si]) si++;
      }
      if (si === sequence.length) matchedUids++;
    });

    res.json({ sequence, matchedUids });
  } catch (err) {
    console.error('flowCount err', err);
    res.status(500).json({ error: err.message });
  }
};

exports.recentFlows = async (req, res) => {
  try {
    const flows = await UserFlow.find().sort({ createdAt: -1 }).limit(200).lean();
    res.json(flows);
  } catch (err) {
    console.error('recentFlows err', err);
    res.status(500).json({ error: err.message });
  }
};

// Extra: get user path by uid
exports.getUserPath = async (req, res) => {
  try {
    const uid = req.params.uid;
    if (!uid) return res.status(400).json({ error: 'uid required' });
    const flow = await UserFlow.findOne({ uid }).lean();
    res.json(flow || {});
  } catch (err) {
    console.error('getUserPath err', err);
    res.status(500).json({ error: err.message });
  }
};

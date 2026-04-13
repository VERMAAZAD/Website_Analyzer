const ScrapedSite = require('../Models/ScrapedSite');

const checkingQueues = new Map(); 

function getOrCreateQueue(userId) {
  if (!checkingQueues.has(userId)) {
    checkingQueues.set(userId, {
      queue: [],
      isChecking: false,
      currentCheckTab: null,
      checkedCount: 0,
      blockedCount: 0,
      startTime: null,
    });
  }
  return checkingQueues.get(userId);
}

function getQueueStatus(userId) {
  const queue = getOrCreateQueue(userId);
  return {
    totalQueued: queue.queue.length,
    isChecking: queue.isChecking,
    checkedCount: queue.checkedCount,
    blockedCount: queue.blockedCount,
    queueItems: queue.queue.map(item => ({
      domain: item.domain,
      status: item.status
    }))
  };
}


function getOwnerId(req) {
  if (req.user.role === 'admin') return null;
  if (req.user.parentUser) return req.user.parentUser;
  return req.user._id;
}


function buildFilter(req, extra = {}) {
  const ownerId = getOwnerId(req);
  if (ownerId === null) {
    return { ...extra };
  }
  return { user: ownerId, ...extra };
}

exports.startBingCheck = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user._id.toString();
    const queue = getOrCreateQueue(userId);

    let domainsToCheck = [];

    if (req.query.domains) {
      // From query parameter
      domainsToCheck = req.query.domains.split(',').map(d => d.trim()).filter(d => d);
    } else {
      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, 0);

      const filter = buildFilter(req, {
        $or: [
          { lastBingCheck: { $exists: false } },
          { lastBingCheck: { $lt: startOfToday } }
        ]
      });

      const domains = await ScrapedSite.find(filter).select('domain');
      domainsToCheck = domains.map(d => d.domain);
    }

    if (domainsToCheck.length === 0) {
      return res.json({
        success: true,
        message: 'No domains to check',
        queued: 0
      });
    }

    queue.queue = domainsToCheck.map(domain => ({
      domain,
      status: 'pending',
      attempts: 0,
    }));

    queue.checkedCount = 0;
    queue.blockedCount = 0;
    queue.startTime = new Date();

    if (!queue.isChecking) {
      queue.isChecking = true;
      performNextCheck(userId).catch(err => {
        console.error('Check error:', err);
      });
    }

    return res.json({
      success: true,
      message: 'Index check started',
      queued: domainsToCheck.length,
      estimatedTime: `${Math.ceil(domainsToCheck.length * 0.2)} minutes`
    });

  } catch (err) {
    console.error('❌ startBingCheck error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getBingCheckStatus = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user._id.toString();
    const status = getQueueStatus(userId);

    return res.json({
      success: true,
      ...status
    });

  } catch (err) {
    console.error('❌ getBingCheckStatus error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.captchaDetected = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { domain } = req.body;
    const userId = req.user._id.toString();
    const queue = getOrCreateQueue(userId);

    const currentItem = queue.queue.find(item => item.domain === domain);
    if (currentItem) {
      currentItem.status = 'blocked';
      currentItem.attempts++;
      queue.blockedCount++;
    }

    console.log(`🚫 [${domain}] CAPTCHA detected - user will solve it`);

    return res.json({
      success: true,
      message: 'CAPTCHA detected. Please solve it and checking will continue.'
    });

  } catch (err) {
    console.error('❌ captchaDetected error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.reportBingResult = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { domain, isIndexed, resultCount } = req.body;
    const userId = req.user._id.toString();
    const queue = getOrCreateQueue(userId);

    console.log(`✅ [${domain}] Result received - Indexed: ${isIndexed}, Results: ${resultCount}`);

    try {
      const siteFilter = buildFilter(req, { domain });
      const site = await ScrapedSite.findOne(siteFilter);
      if (site) {
        site.isIndexedOnBing = isIndexed;
        site.lastBingCheck = new Date();
        site.bingResultCount = resultCount;
        await site.save();
      }
    } catch (dbErr) {
      console.error(`⚠️ DB error for ${domain}:`, dbErr);
    }

    const queueItem = queue.queue.find(item => item.domain === domain);
    if (queueItem) {
      queueItem.status = 'checked';
      queue.checkedCount++;
    }

    setTimeout(() => {
      if (queue.isChecking) {
        performNextCheck(userId).catch(err => {
          console.error('Check error:', err);
        });
      }
    }, 3000);

    return res.json({
      success: true,
      message: 'Result saved, proceeding to next domain',
      nextDomain: getNextPendingDomain(userId)
    });

  } catch (err) {
    console.error('❌ reportBingResult error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

exports.getNextDomain = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user._id.toString();
    const nextDomain = getNextPendingDomain(userId);

    return res.json({
      success: true,
      domain: nextDomain,
      bingUrl: nextDomain
        ? `https://www.bing.com/search?q=site:${nextDomain}&frominr=1`
        : null
    });

  } catch (err) {
    console.error('❌ getNextDomain error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.stopBingCheck = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user._id.toString();
    const queue = getOrCreateQueue(userId);

    queue.isChecking = false;
    queue.queue = [];

    console.log(`🛑 Check stopped for user ${userId}`);

    return res.json({
      success: true,
      message: 'Index check stopped'
    });

  } catch (err) {
    console.error('❌ stopBingCheck error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.getBingCheckReport = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user._id.toString();
    const queue = getOrCreateQueue(userId);

    const filter = buildFilter(req, { isIndexedOnBing: false });

    const unindexed = await ScrapedSite.find(filter)
      .select('domain lastBingCheck bingResultCount')
      .sort({ lastBingCheck: -1 })
      .lean();

    const duration = queue.startTime
      ? Math.round((Date.now() - queue.startTime.getTime()) / 1000 / 60)
      : 0;

    return res.json({
      success: true,
      summary: {
        totalChecked: queue.checkedCount,
        totalBlocked: queue.blockedCount,
        durationMinutes: duration,
        unindexedCount: unindexed.length
      },
      unindexedDomains: unindexed
    });

  } catch (err) {
    console.error('❌ getBingCheckReport error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

function getNextPendingDomain(userId) {
  const queue = getOrCreateQueue(userId);
  const pending = queue.queue.find(item => item.status === 'pending');
  return pending ? pending.domain : null;
}

async function performNextCheck(userId) {
  const queue = getOrCreateQueue(userId);

  if (!queue.isChecking) {
    return;
  }

  const nextDomain = getNextPendingDomain(userId);

  if (!nextDomain) {
    queue.isChecking = false;
    console.log(`✅ Check queue complete for user ${userId}`);
    console.log(`   Total checked: ${queue.checkedCount}`);
    console.log(`   Total blocked: ${queue.blockedCount}`);
    return;
  }

  console.log(`📝 Queued for checking: ${nextDomain}`);
}

exports.getUnindexedDomains = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filter = buildFilter(req, { isIndexedOnBing: false });

    const unindexed = await ScrapedSite.find(filter)
      .select('domain lastBingCheck bingResultCount')
      .sort({ lastBingCheck: -1 })
      .lean();

    return res.json({ unindexed });

  } catch (err) {
    console.error('❌ getUnindexedDomains error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
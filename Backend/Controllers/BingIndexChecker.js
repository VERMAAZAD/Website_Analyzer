// ============================================================================
// BingIndexChecker.js - Extension-Based Approach
// Single tab, user solves CAPTCHA, sequential checking
// ============================================================================

const ScrapedSite = require('../Models/ScrapedSite');

// ============ QUEUE MANAGEMENT ============

// In-memory queue for active checks
const checkingQueues = new Map(); // userId -> { queue: [], isChecking: boolean }

/**
 * Initialize or get checking queue for a user
 */
function getOrCreateQueue(userId) {
  if (!checkingQueues.has(userId)) {
    checkingQueues.set(userId, {
      queue: [],
      isChecking: false,
      currentCheckTab: null,
      checkedCount: 0,
      blockedCount: 0,
      startTime: null,
      // clientSocket: null,  // Removed: was initialized but never used
    });
  }
  return checkingQueues.get(userId);
}

/**
 * Get queue status
 */
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

// ============ MAIN ENDPOINTS ============

/**
 * Start checking domains - single tab approach
 * GET /api/scraper/bing-check-start?domains=domain1.com,domain2.com
 */
exports.startBingCheck = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user._id.toString();
    const queue = getOrCreateQueue(userId);

    // Get domains to check
    let domainsToCheck = [];
    
    if (req.query.domains) {
      // From query parameter
      domainsToCheck = req.query.domains.split(',').map(d => d.trim()).filter(d => d);
    } else {
      // From database - all unchecked domains for this user
      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, 0);

      let filter;
      if (req.user.role === "admin") {
        filter = {
          $or: [
            { lastBingCheck: { $exists: false } },
            { lastBingCheck: { $lt: startOfToday } }
          ]
        };
      } else if (req.user.parentUser) {
        filter = {
          user: req.user.parentUser,
          $or: [
            { lastBingCheck: { $exists: false } },
            { lastBingCheck: { $lt: startOfToday } }
          ]
        };
      } else {
        filter = {
          user: req.user._id,
          $or: [
            { lastBingCheck: { $exists: false } },
            { lastBingCheck: { $lt: startOfToday } }
          ]
        };
      }

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

    // Add to queue
    queue.queue = domainsToCheck.map(domain => ({
      domain,
      status: 'pending',
      attempts: 0,
    }));

    queue.checkedCount = 0;
    queue.blockedCount = 0;
    queue.startTime = new Date();

    // If not already checking, start
    if (!queue.isChecking) {
      queue.isChecking = true;
      // Don't await - let it run in background
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

/**
 * Get current queue status
 * GET /api/scraper/bing-check-status
 */
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

/**
 * Report CAPTCHA detected
 * POST /api/scraper/bing-captcha-detected
 * Body: { domain: "example.com" }
 */
exports.captchaDetected = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { domain } = req.body;
    const userId = req.user._id.toString();
    const queue = getOrCreateQueue(userId);

    // Mark current domain as blocked
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

/**
 * Report domain indexing result
 * POST /api/scraper/bing-report-result
 * Body: { domain: "example.com", isIndexed: true, resultCount: 42 }
 */
exports.reportBingResult = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { domain, isIndexed, resultCount } = req.body;
    const userId = req.user._id.toString();
    const queue = getOrCreateQueue(userId);

    console.log(`✅ [${domain}] Result received - Indexed: ${isIndexed}, Results: ${resultCount}`);

    // FIX #5: Scope the DB lookup to the correct user to avoid cross-user data leaks
    try {
      // Determine which userId owns this domain
      let ownerUserId = req.user._id;
      if (req.user.parentUser) {
        ownerUserId = req.user.parentUser;
      }

      const siteFilter = req.user.role === 'admin'
        ? { domain }
        : { domain, user: ownerUserId };

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

    // Mark as checked in queue
    const queueItem = queue.queue.find(item => item.domain === domain);
    if (queueItem) {
      queueItem.status = 'checked';
      queue.checkedCount++;
    }

    // FIX #4: Only continue if the queue is still active (user may have stopped it)
    setTimeout(() => {
      if (queue.isChecking) {
        performNextCheck(userId).catch(err => {
          console.error('Check error:', err);
        });
      }
    }, 3000); // 3 second delay before next check

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

/**
 * Get next domain to check
 * GET /api/scraper/bing-next-domain
 */
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

/**
 * Stop checking
 * POST /api/scraper/bing-check-stop
 */
exports.stopBingCheck = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user._id.toString();
    const queue = getOrCreateQueue(userId);

    // FIX #4: Set isChecking = false BEFORE clearing the queue so the setTimeout
    // guard in reportBingResult correctly prevents restarting
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

/**
 * Get final report
 * GET /api/scraper/bing-check-report
 */
exports.getBingCheckReport = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user._id.toString();
    const queue = getOrCreateQueue(userId);

    // Get unindexed domains
    let filter;
    if (req.user.role === "admin") {
      filter = { isIndexedOnBing: false };
    } else if (req.user.parentUser) {
      filter = { user: req.user.parentUser, isIndexedOnBing: false };
    } else {
      filter = { user: req.user._id, isIndexedOnBing: false };
    }

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

// ============ HELPER FUNCTIONS ============

/**
 * Get next pending domain from queue
 */
function getNextPendingDomain(userId) {
  const queue = getOrCreateQueue(userId);
  const pending = queue.queue.find(item => item.status === 'pending');
  return pending ? pending.domain : null;
}

/**
 * Perform next check in background (just coordinates, doesn't actually check)
 */
async function performNextCheck(userId) {
  const queue = getOrCreateQueue(userId);

  if (!queue.isChecking) {
    return;
  }

  const nextDomain = getNextPendingDomain(userId);

  if (!nextDomain) {
    // Queue complete
    queue.isChecking = false;
    console.log(`✅ Check queue complete for user ${userId}`);
    console.log(`   Total checked: ${queue.checkedCount}`);
    console.log(`   Total blocked: ${queue.blockedCount}`);
    return;
  }

  // Just log - actual checking happens in browser extension
  console.log(`📝 Queued for checking: ${nextDomain}`);
}

/**
 * Get unindexed domains (for UI display)
 */
exports.getUnindexedDomains = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let filter;
    if (req.user.role === "admin") {
      filter = { isIndexedOnBing: false };
    } else if (req.user.parentUser) {
      filter = { user: req.user.parentUser, isIndexedOnBing: false };
    } else {
      filter = { user: req.user._id, isIndexedOnBing: false };
    }

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
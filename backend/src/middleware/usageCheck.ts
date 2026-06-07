import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { getDb } from '../config/database';
import { usageLogs } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const PLAN_LIMITS: Record<string, number> = {
  free: 50,
  pro: Infinity,
  enterprise: Infinity,
};

export async function checkUsageLimit(req: AuthRequest, res: Response, next: NextFunction) {
  // Only check for authenticated users running automations
  if (!req.userId) return next();

  const plan = req.userPlan || 'free';
  const limit = PLAN_LIMITS[plan] ?? 50;
  if (limit === Infinity) return next();

  try {
    const db = getDb();
    const month = new Date().toISOString().slice(0, 7);
    const log = await db.query.usageLogs.findFirst({
      where: and(eq(usageLogs.userId, req.userId), eq(usageLogs.month, month))
    });

    if (log && log.runCount >= limit) {
      return res.status(429).json({
        error: `You've reached your ${limit} runs/month limit on the Free plan. Upgrade to Pro for unlimited runs.`,
        upgradeRequired: true,
      });
    }

    // Increment counter
    if (log) {
      await db.update(usageLogs)
        .set({ runCount: log.runCount + 1, updatedAt: new Date() })
        .where(and(eq(usageLogs.userId, req.userId), eq(usageLogs.month, month)));
    } else {
      await db.insert(usageLogs).values({
        id: randomUUID(),
        userId: req.userId,
        month,
        runCount: 1,
        updatedAt: new Date(),
      });
    }

    next();
  } catch (error) {
    console.error('Usage check error:', error);
    next(); // Don't block on error
  }
}

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/database';
import { users, usageLogs, workflows, executions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'flowpilot-secret-change-in-production';

function makeToken(userId: string, plan: string) {
  return jwt.sign({ userId, plan }, JWT_SECRET, { expiresIn: '30d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, plan } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const db = getDb();
    const existing = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const userPlan = ['free', 'pro', 'enterprise'].includes(plan) ? plan : 'free';

    const [user] = await db.insert(users).values({
      id: randomUUID(),
      email: email.toLowerCase(),
      name: name || null,
      passwordHash,
      plan: userPlan,
    }).returning();

    const token = makeToken(user.id, user.plan);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan, createdAt: user.createdAt }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const db = getDb();
    const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = makeToken(user.id, user.plan);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan, createdAt: user.createdAt }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const user = await db.query.users.findFirst({ where: eq(users.id, req.userId!) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email, name: user.name, plan: user.plan, createdAt: user.createdAt });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/auth/usage
router.get('/usage', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const db = getDb();
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    const log = await db.query.usageLogs.findFirst({
      where: and(eq(usageLogs.userId, req.userId!), eq(usageLogs.month, month))
    });
    const allWorkflows = await db.query.workflows.findMany({
      where: eq(workflows.userId, req.userId!)
    });
    const allExecutions = await db.query.executions.findMany({
      where: eq(executions.userId, req.userId!)
    });
    res.json({
      runsThisMonth: log?.runCount || 0,
      totalWorkflows: allWorkflows.length,
      totalExecutions: allExecutions.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

export default router;

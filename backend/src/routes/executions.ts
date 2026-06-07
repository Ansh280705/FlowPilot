import express from 'express';
import { getDb } from '../config/database';
import { executions } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const router = express.Router();

// Get all executions
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const allExecutions = await db.query.executions.findMany({
      orderBy: [desc(executions.startedAt)],
    });
    res.json(allExecutions);
  } catch (error) {
    console.error('Error fetching executions:', error);
    res.status(500).json({ error: 'Failed to fetch executions' });
  }
});

// Get execution by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, req.params.id),
    });

    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    res.json(execution);
  } catch (error) {
    console.error('Error fetching execution:', error);
    res.status(500).json({ error: 'Failed to fetch execution' });
  }
});

// Create execution
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { workflowId, status, variables, currentStep, logs, error, retryCount, userId, url } = req.body;

    const [newExecution] = await db.insert(executions).values({
      id: randomUUID(),
      workflowId,
      status: status || 'pending',
      variables: variables || {},
      currentStep: currentStep || 0,
      logs: logs || [],
      error,
      retryCount: retryCount || 0,
      userId: userId || 'default-user',
      url,
    }).returning();

    res.status(201).json(newExecution);
  } catch (error) {
    console.error('Error creating execution:', error);
    res.status(500).json({ error: 'Failed to create execution' });
  }
});

// Update execution
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { status, currentStep, logs, error, retryCount, completedAt } = req.body;

    const [updatedExecution] = await db.update(executions)
      .set({
        status,
        currentStep,
        logs,
        error,
        retryCount,
        completedAt,
      })
      .where(eq(executions.id, req.params.id))
      .returning();

    res.json(updatedExecution);
  } catch (error) {
    console.error('Error updating execution:', error);
    res.status(500).json({ error: 'Failed to update execution' });
  }
});

export default router;

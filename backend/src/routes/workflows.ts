import express from 'express';
import { randomUUID } from 'crypto';
import { getDb } from '../config/database';
import { workflows, workflowVariables } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Get all workflows
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const allWorkflows = await db.query.workflows.findMany({
      orderBy: [desc(workflows.createdAt)],
      with: {
        variables: true,
      },
    });
    res.json(allWorkflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// Get workflow by ID
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, req.params.id),
      with: {
        variables: true,
      },
    });
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    
    res.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

// Create workflow
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { name, description, steps, variables, userId, isPublic, tags } = req.body;
    
    const [newWorkflow] = await db.insert(workflows).values({
      id: randomUUID(),
      name,
      description,
      steps,
      variables: variables || [],
      userId: userId || 'default-user',
      isPublic: isPublic || false,
      tags: tags || [],
    }).returning();
    
    // Insert variables if provided
    if (variables && variables.length > 0) {
      for (const variable of variables) {
        await db.insert(workflowVariables).values({
          id: randomUUID(),
          workflowId: newWorkflow.id,
          name: variable.name,
          type: variable.type,
          defaultValue: variable.defaultValue,
          description: variable.description,
          required: variable.required,
        });
      }
    }
    
    res.status(201).json(newWorkflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// Update workflow
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const { name, description, steps, variables, isPublic, tags } = req.body;

    const [updatedWorkflow] = await db.update(workflows)
      .set({
        name,
        description,
        steps,
        variables: variables || [],
        updatedAt: new Date(),
        isPublic,
        tags,
      })
      .where(eq(workflows.id, req.params.id))
      .returning();

    // Sync relational variables table
    if (variables !== undefined) {
      await db.delete(workflowVariables).where(eq(workflowVariables.workflowId, req.params.id));
      if (variables && variables.length > 0) {
        for (const variable of variables) {
          await db.insert(workflowVariables).values({
            id: randomUUID(),
            workflowId: req.params.id,
            name: variable.name,
            type: variable.type,
            defaultValue: variable.defaultValue,
            description: variable.description,
            required: variable.required,
          });
        }
      }
    }

    res.json(updatedWorkflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// Delete workflow
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.delete(workflows).where(eq(workflows.id, req.params.id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

export default router;

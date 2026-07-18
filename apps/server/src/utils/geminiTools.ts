import { FunctionDeclaration, Type } from '@google/generative-ai';
import { db } from '../config/firestore';
import crypto from 'crypto';

// 1. Declare tool schemas for Gemini
const updateSignageDeclaration: FunctionDeclaration = {
  name: 'updateSignage',
  description: 'Update dynamic stadium signage boards to redirect crowd egress traffic or display alerts.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      displayId: {
        type: Type.STRING,
        description: 'The physical ID of the display board (e.g. "Gate_A_Display", "Stairway_Exit_12").',
      },
      text: {
        type: Type.STRING,
        description: 'The message text to display (e.g. "Gate A Busy - Use Gate B", "Evacuate Section 104").',
      },
      arrowDirection: {
        type: Type.STRING,
        enum: ['left', 'right', 'up', 'down', 'none'],
        description: 'Arrow visual indicator to display on dynamic route signboards.',
      },
    },
    required: ['displayId', 'text', 'arrowDirection'],
  },
};

const dispatchVolunteersDeclaration: FunctionDeclaration = {
  name: 'dispatchVolunteers',
  description: 'Dispatch active volunteer marshalls to clear congestion, staff gates, or assist with incidents.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      sector: {
        type: Type.STRING,
        description: 'The physical sector / concourse level requiring support (e.g. "Sector 104", "Concourse C").',
      },
      count: {
        type: Type.INTEGER,
        description: 'Number of volunteers to assign to the task.',
      },
      taskDescription: {
        type: Type.STRING,
        description: 'Description of the operations to be carried out (e.g. "Clear exit bottleneck", "Triage dehydration patient").',
      },
    },
    required: ['sector', 'count', 'taskDescription'],
  },
};

const triggerBroadcastDeclaration: FunctionDeclaration = {
  name: 'triggerBroadcast',
  description: 'Broadcast alerts to mobile apps or staff SMS channels.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'Headline alert title.',
      },
      body: {
        type: Type.STRING,
        description: 'Alert message content.',
      },
      targetAudience: {
        type: Type.STRING,
        enum: ['all', 'staff'],
        description: 'Send warning notification to either all stadium fans or restricted staff members only.',
      },
    },
    required: ['title', 'body', 'targetAudience'],
  },
};

// Export tool lists for Gemini configuration
export const geminiTools = [
  {
    functionDeclarations: [
      updateSignageDeclaration,
      dispatchVolunteersDeclaration,
      triggerBroadcastDeclaration,
    ],
  },
];

// 2. Execute local tools and save changes in Firestore
export const executeToolCall = async (
  name: string,
  args: any
): Promise<Record<string, any>> => {
  console.log(`[gemini-tools]: Executing local tool "${name}" with args:`, args);

  try {
    if (name === 'updateSignage') {
      const { displayId, text, arrowDirection } = args;
      const docId = crypto.randomUUID();

      await db.collection('notifications').doc(docId).set({
        id: docId,
        title: `Signage update: ${displayId}`,
        body: text,
        targetChannels: ['digital-signage'],
        targetAudience: 'all',
        targetSector: displayId,
        signageDirectives: [
          {
            displayId,
            text,
            arrowDirection: arrowDirection !== 'none' ? arrowDirection : undefined,
          },
        ],
        sentBy: 'system-ai',
        sentAt: new Date().toISOString(),
        status: 'sent',
      });

      return { status: 'success', message: `Signage board ${displayId} successfully updated.` };
    }

    if (name === 'dispatchVolunteers') {
      const { sector, count, taskDescription } = args;

      // Query active volunteers in the sector to assign tasks
      const snapshot = await db
        .collection('volunteers')
        .where('assignedSector', '==', sector)
        .where('status', '==', 'active')
        .limit(count)
        .get();

      const batch = db.batch();
      let updatedCount = 0;

      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { currentTaskId: taskDescription });
        updatedCount++;
      });

      if (updatedCount > 0) {
        await batch.commit();
      }

      // If fewer volunteers than requested are found, log a task ticket
      if (updatedCount < count) {
        const ticketId = crypto.randomUUID();
        await db.collection('incidents').doc(ticketId).set({
          id: ticketId,
          type: 'other',
          severity: 'medium',
          status: 'reported',
          location: { sector, level: '1', description: 'AI Dispatched Task' },
          reportedBy: 'system-ai',
          reportedAt: new Date().toISOString(),
          description: `UNFULFILLED VOLUNTEER REQUEST: Need ${count - updatedCount} more volunteers for task: ${taskDescription}`,
        });
      }

      return {
        status: 'success',
        message: `Successfully assigned ${updatedCount} volunteers to task in ${sector}. Generated dispatch ticket for remaining ${count - updatedCount} agents.`,
      };
    }

    if (name === 'triggerBroadcast') {
      const { title, body: msgBody, targetAudience } = args;
      const docId = crypto.randomUUID();

      await db.collection('notifications').doc(docId).set({
        id: docId,
        title,
        body: msgBody,
        targetChannels: targetAudience === 'staff' ? ['sms'] : ['app-push', 'sms'],
        targetAudience,
        sentBy: 'system-ai',
        sentAt: new Date().toISOString(),
        status: 'sent',
      });

      return { status: 'success', message: `Broadcast successfully transmitted to ${targetAudience}.` };
    }

    throw new Error(`Tool ${name} not found`);
  } catch (error: any) {
    console.error(`[gemini-tools]: Tool execution failed for "${name}":`, error);
    return { status: 'error', error: error.message };
  }
};

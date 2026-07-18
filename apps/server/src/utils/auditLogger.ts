import { db } from '../config/firestore';
import { AuditLog } from '@crowdmind/shared';
import crypto from 'crypto';

// Writes administrative action details to Firestore AuditLogs collection
export const logAudit = async (
  userId: string,
  email: string,
  action: 'create' | 'update' | 'delete' | 'other',
  collectionName: string,
  docId: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    const logId = crypto.randomUUID();
    const logEntry: AuditLog = {
      id: logId,
      userId,
      userEmail: email,
      action,
      collection: collectionName,
      docId,
      timestamp: new Date().toISOString(),
      metadata,
    };
    await db.collection('AuditLogs').doc(logId).set(logEntry);
  } catch (error) {
    console.error('[audit-logger]: Failed to write audit log:', error);
  }
};

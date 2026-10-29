import { Schema, model, Document, Types } from 'mongoose';

export type AuditEventType =
  | 'admin_login'
  | 'student_status_change'
  | 'admin_provisioned'
  | 'placement_officer_provisioned'
  | 'job_created'
  | 'job_updated'
  | 'job_status_change'
  | 'job_deleted'
  | 'career_role_created'
  | 'career_role_updated'
  | 'career_role_status_change'
  | 'career_role_deleted'
  | 'learning_resource_created'
  | 'learning_resource_updated'
  | 'learning_resource_deleted'
  | 'settings_updated'
  | 'drive_created'
  | 'drive_updated'
  | 'drive_status_change'
  | 'candidate_registered'
  | 'candidate_stage_update'
  | 'eligibility_override'
  | 'placement_report_exported'
  | 'announcement_created'
  | 'coding_question_created'
  | 'coding_question_updated'
  | 'coding_assessment_created'
  | 'coding_assessment_published'
  | 'coding_submission_evaluated';

export interface IAuditLogData {
  eventType: AuditEventType;
  actorId: Types.ObjectId;
  actorEmail: string;
  actorName: string;
  targetId?: string;
  targetType?: string;
  action: string;
  status: 'success' | 'failure';
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface IAuditLog extends Document, IAuditLogData {
  _id: Types.ObjectId;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    actorName: {
      type: String,
      required: true,
      trim: true,
    },
    targetId: {
      type: String,
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      trim: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable: no updatedAt
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        if (ret._id) {
          ret.id = ret._id.toString();
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

// High performance query index for admin audit log viewer
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ eventType: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);


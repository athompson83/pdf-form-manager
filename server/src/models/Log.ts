import mongoose, { Document, Schema } from 'mongoose';

export interface ILog extends Document {
  action: string;
  status: 'success' | 'error' | 'warning';
  userId: Schema.Types.ObjectId;
  details: {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    error?: string;
    requestBody?: any;
    responseBody?: any;
  };
}

const logSchema = new Schema(
  {
    action: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'error', 'warning'],
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    details: {
      method: {
        type: String,
        required: true,
      },
      path: {
        type: String,
        required: true,
      },
      statusCode: {
        type: Number,
        required: true,
      },
      duration: {
        type: Number,
        required: true,
      },
      error: {
        type: String,
      },
      requestBody: {
        type: Schema.Types.Mixed,
      },
      responseBody: {
        type: Schema.Types.Mixed,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
logSchema.index({ action: 1, status: 1, createdAt: -1 });
logSchema.index({ userId: 1, createdAt: -1 });

export const Log = mongoose.model<ILog>('Log', logSchema);

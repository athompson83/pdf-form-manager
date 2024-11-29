import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IAPIKey extends Document {
  name: string;
  key: string;
  permissions: string[];
  status: 'active' | 'revoked';
  lastUsed: Date | null;
  createdBy: Schema.Types.ObjectId;
}

const apiKeySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
    },
    permissions: [{
      type: String,
      enum: [
        'templates:read',
        'templates:write',
        'forms:fill',
        'webhooks:manage',
      ],
    }],
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
    },
    lastUsed: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

apiKeySchema.pre('save', function (next) {
  if (this.isNew) {
    this.key = `pk_${crypto.randomBytes(32).toString('hex')}`;
  }
  next();
});

export const APIKey = mongoose.model<IAPIKey>('APIKey', apiKeySchema);

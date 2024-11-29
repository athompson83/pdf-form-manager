import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  description: string;
  filePath: string;
  fields: {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: string;
  }[];
  status: 'active' | 'archived';
  createdBy: Schema.Types.ObjectId;
  usageCount: number;
}

const templateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fields: [{
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
        enum: ['text', 'number', 'date', 'checkbox', 'radio'],
      },
      required: {
        type: Boolean,
        default: false,
      },
      defaultValue: {
        type: String,
      },
    }],
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Template = mongoose.model<ITemplate>('Template', templateSchema);

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IToken extends Document {
  user_id: Types.ObjectId;
  token: string;
  created_at: Date;
  expired_at: Date;
}

const TokenSchema = new Schema<IToken>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    expired_at: { type: Date },
  },
  { timestamps: true },
);

TokenSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true,
});

export const Token = mongoose.model<IToken>('Token', TokenSchema);

import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'manager' | 'viewer';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  googleId?: string;
  assignedTournaments: string[]; // Array of tournament IDs
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    _id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    image: {
      type: String,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'viewer'],
      default: 'viewer',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    assignedTournaments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ assignedTournaments: 1 });

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

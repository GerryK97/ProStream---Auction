import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Tournament' | 'MasterManager' | 'Team' | 'Player' | 'Audience';
  status: 'Active' | 'PendingApproval' | 'Suspended';

  // Role-specific assignments
  assignedTournaments?: string[]; // For Tournament Managers
  assignedTeams?: string[]; // For Team Managers
  assignedPlayer?: string; // For Players (links to player profile)

  // Session & Auth
  lastLogin?: Date;
  lastIPAddress?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
      match: /^[a-zA-Z0-9_-]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'Tournament', 'MasterManager', 'Team', 'Player', 'Audience'],
      required: true,
      default: 'Audience',
    },
    status: {
      type: String,
      enum: ['Active', 'PendingApproval', 'Suspended'],
      required: true,
      default: 'PendingApproval',
    },
    assignedTournaments: {
      type: [String],
      default: [],
    },
    assignedTeams: {
      type: [String],
      default: [],
    },
    assignedPlayer: {
      type: String,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    lastIPAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

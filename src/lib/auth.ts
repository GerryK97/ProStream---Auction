import { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { connectToDatabase } from './mongodb';
import { UserModel } from '@/models/User';
import { generateId } from './id-generator';

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, profile }) {
      try {
        await connectToDatabase();

        // Check if user exists
        let existingUser = await UserModel.findOne({ email: user.email });

        if (!existingUser) {
          // Create new user with auto-generated ID
          const userId = generateId('user');

          existingUser = new UserModel({
            _id: userId,
            name: user.name || profile?.name || 'User',
            email: user.email,
            image: user.image || profile?.image,
            googleId: profile?.sub,
            role: 'viewer', // Default role is viewer
            assignedTournaments: [],
          });

          await existingUser.save();
        } else if (!existingUser.googleId && profile?.sub) {
          // Update existing user with Google ID if missing
          existingUser.googleId = profile.sub;
          await existingUser.save();
        }

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },

    async jwt({ token, user, profile }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }

      if (profile?.sub) {
        token.googleId = profile.sub;
      }

      // Fetch user data to include role and assignedTournaments
      try {
        await connectToDatabase();
        const dbUser = await UserModel.findOne({ email: token.email });

        if (dbUser) {
          token.role = dbUser.role;
          token.assignedTournaments = dbUser.assignedTournaments;
          token.userId = dbUser._id;
        }
      } catch (error) {
        console.error('Error fetching user data for JWT:', error);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string || token.sub as string;
        (session.user as any).role = token.role as string;
        (session.user as any).assignedTournaments = token.assignedTournaments as string[] || [];
      }
      return session;
    },
  },
};

export default authConfig;

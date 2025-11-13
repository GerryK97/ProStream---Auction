import { type NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { connectToDatabase } from './mongodb';
import { UserModel } from '@/models/User';
import { generateId } from './id-generator';
import { comparePassword } from './password';

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          await connectToDatabase();

          // Find user and explicitly include password field
          const user = await UserModel.findOne({
            email: (credentials.email as string).toLowerCase()
          }).select('+password');

          if (!user) {
            // User not found - return null to prevent user enumeration
            return null;
          }

          // Check if user has a password (might be Google-only user)
          if (!user.password) {
            return null;
          }

          // Verify password
          const isValidPassword = await comparePassword(
            credentials.password as string,
            user.password
          );

          if (!isValidPassword) {
            return null;
          }

          // Return user object (without password)
          return {
            id: user._id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            assignedTournaments: user.assignedTournaments,
          } as any;
        } catch (error) {
          console.error('Error in credentials authorize:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, profile, account }) {
      try {
        await connectToDatabase();

        // Handle Google OAuth sign-in
        if (account?.provider === 'google') {
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
              authMethod: 'google',
              role: 'viewer', // Default role is viewer
              assignedTournaments: [],
            });

            await existingUser.save();
          } else if (!existingUser.googleId && profile?.sub) {
            // Update existing user with Google ID if missing
            existingUser.googleId = profile.sub;

            // Update auth method if needed
            if (existingUser.authMethod === 'credentials') {
              existingUser.authMethod = 'both';
            }

            await existingUser.save();
          }
        }

        // Handle Credentials sign-in (already validated in authorize)
        // No additional action needed - user was already validated

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

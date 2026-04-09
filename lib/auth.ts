import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('NoUser');
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          throw new Error('NoUser');
        }

        if (!user.password) {
          throw new Error('NoPassword');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('WrongPassword');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.username = user.username;
        token.role = user.role;

        if (user.id) {
          token.id = user.id;
        } else if (user.email) {
          await dbConnect();
          const existingUser = await User.findOne({ email: user.email });
          if (existingUser) {
            token.id = existingUser._id.toString();
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.id || token.sub) as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await dbConnect();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          return '/auth/signin?error=GoogleNotRegistered';
        }
      }
      return true;
    },
  },
};
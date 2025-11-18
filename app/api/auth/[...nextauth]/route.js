import NextAuth from 'next-auth';
import GitHubProvider from "next-auth/providers/github";

import User from '@models/user';
import { connectToDB } from '@utils/database';

const handler = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  ],
  callbacks: {
    async session({ session }) {
      // fetch the user id from MongoDB and attach to the session
      const sessionUser = await User.findOne({ email: session.user.email });
      session.user.id = sessionUser._id.toString();

      return session;
    },

    async signIn({ profile }) {
      try {
        await connectToDB();

        // GitHub sometimes hides email
        const userEmail = profile.email || `${profile.login}@github.com`;

        // check if user already exists
        const userExists = await User.findOne({ email: userEmail });

        // if not, create new user
        if (!userExists) {
          await User.create({
            email: userEmail,
            username: profile.login.toLowerCase(),
            image: profile.avatar_url,
          });
        }

        return true;

      } catch (error) {
        console.log("Sign in error: ", error);
        return false;
      }
    },
  }
});

export { handler as GET, handler as POST };


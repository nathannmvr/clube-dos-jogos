// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  
  session: {
    strategy: "jwt",
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  callbacks: {
    async jwt({ token, user }) {
      // Na primeira vez que o utilizador faz login, o objeto 'user' está disponível.
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    
    async session({ session, token }) {
      // Passamos o 'id' do token para a sessão.
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
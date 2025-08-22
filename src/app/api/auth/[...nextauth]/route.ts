// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  
  // ADICIONE ESTA SEÇÃO DE CALLBACKS
  callbacks: {
    async session({ session, token }) {
      // O 'token.sub' é o ID do usuário que vem do provedor (neste caso, Google)
      // Estamos pegando esse ID e colocando-o dentro do objeto da sessão.
      if (token && session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
})

export { handler as GET, handler as POST }
import 'next-auth';

declare module 'next-auth' {
  /**
   * Extende o tipo da sessão para incluir a propriedade 'id' do usuário.
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
// src/app/admin/add-game/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AddGameForm from "@/components/AddGameForm"; // Criaremos este componente a seguir

export default async function AddGamePage() {
  const session = await getServerSession();
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

  // Proteção da página no lado do servidor
  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    redirect('/'); // Se não for admin, redireciona para a home
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Adicionar Novo Jogo</h1>
      <p className="text-slate-400 mb-6">Esta página só é visível para administradores.</p>
      <AddGameForm />
    </div>
  );
}
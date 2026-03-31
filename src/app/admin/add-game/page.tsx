// src/app/admin/add-game/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import AddGameForm from "@/components/AddGameForm";
import Link from "next/link";

export default async function AddGamePage() {
  const session = await getServerSession(authOptions);
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    redirect('/');
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <Link href="/admin/manage-games">
          <button className="btn-pixel btn-pixel-yellow" style={{ fontSize: '8px' }}>
            ◀ VOLTAR
          </button>
        </Link>
        <h1 className="pixel-font neon-cyan" style={{ fontSize: '10px' }}>
          ADICIONAR JOGO
        </h1>
      </div>
      <div className="pixel-card" style={{ padding: '32px' }}>
        <AddGameForm />
      </div>
    </div>
  );
}
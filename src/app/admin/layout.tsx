import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  const isAdmin = session?.user?.email ? adminEmails.includes(session.user.email) : false;

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="pixel-font neon-yellow" style={{ fontSize: '14px', marginBottom: '24px' }}>
          PAINEL DE ADMINISTRAÇÃO
        </h1>
        <div style={{ 
          display: 'flex', gap: '8px', flexWrap: 'wrap', 
          borderBottom: '2px solid #2a2a5a', paddingBottom: '16px' 
        }}>
          <Link href="/admin/manage-games" style={{ textDecoration: 'none' }}>
            <span className="btn-pixel btn-pixel-grey" style={{ fontSize: '8px', padding: '8px 12px' }}>JOGOS</span>
          </Link>
          <Link href="/admin/dashboard" style={{ textDecoration: 'none' }}>
            <span className="btn-pixel btn-pixel-grey" style={{ fontSize: '8px', padding: '8px 12px' }}>DASHBOARD</span>
          </Link>
          <Link href="/admin/moderate-reviews" style={{ textDecoration: 'none' }}>
            <span className="btn-pixel btn-pixel-grey" style={{ fontSize: '8px', padding: '8px 12px' }}>MODERAÇÃO</span>
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}

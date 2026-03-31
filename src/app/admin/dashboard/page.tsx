import { kv } from '@/lib/kv';
import { Game, GameReview } from '@/lib/types';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

async function getStats() {
  const gameSlugs = await kv.smembers('games:all');
  
  const games = await Promise.all(
    gameSlugs.map(async (slug) => {
      const game = await kv.get<Game>(`game:${slug}`);
      if (!game) return null;

      const reviewIds = await kv.lrange<string>(`reviews_for_game:${slug}`, 0, -1);
      const reviewCount = reviewIds?.length || 0;
      
      let avgScore = 0;
      if (reviewCount > 0) {
        const reviews = await kv.mget<GameReview[]>(...reviewIds.map(id => `review:${id}`));
        const valid = reviews.filter((r): r is GameReview => r !== null);
        if (valid.length > 0) {
           avgScore = valid.reduce((acc, curr) => acc + curr.notaFinal, 0) / valid.length;
        }
      }

      return { ...game, reviewCount, avgScore };
    })
  );

  const validGames = games.filter((g): g is NonNullable<typeof g> => g !== null);

  const mostReviewed = [...validGames].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5);
  const highestRated = [...validGames]
    .filter(g => g.reviewCount > 0)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5);

  return { mostReviewed, highestRated, totalGames: validGames.length };
}

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

  if (!session?.user?.email || !adminEmails.includes(session.user.email)) {
    redirect('/');
  }

  const { mostReviewed, highestRated, totalGames } = await getStats();

  return (
    <div>
      <h2 className="pixel-font" style={{ fontSize: '10px', color: '#ffd700', marginBottom: '32px' }}>
        ▼ ESTATÍSTICAS DO CLUBE ({totalGames} JOGOS CADASTRADOS)
      </h2>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {/* Most Reviewed */}
        <div style={{ flex: '1 1 300px', background: '#0d0d1a', border: '2px solid #2a2a5a', padding: '24px' }}>
           <h3 className="pixel-font" style={{ fontSize: '8px', color: '#00f5ff', marginBottom: '24px' }}>
             MAIS AVALIADOS
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {mostReviewed.length === 0 ? <p style={{ color: '#6060a0', fontFamily: "'VT323'" }}>Sem dados</p> : mostReviewed.map((game, i) => {
               const maxReviews = Math.max(...mostReviewed.map(g => g.reviewCount));
               const widthPct = maxReviews > 0 ? (game.reviewCount / maxReviews) * 100 : 0;
               return (
                 <div key={game.slug}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                     <span style={{ fontFamily: "'VT323'", fontSize: '16px', color: i === 0 ? '#ffd700' : '#a0a0d0' }}>
                       {i + 1}. {game.title}
                     </span>
                     <span style={{ fontFamily: "'Press Start 2P'", fontSize: '8px', color: '#39ff14' }}>
                       {game.reviewCount} <span style={{ color: '#6060a0' }}>REV</span>
                     </span>
                   </div>
                   <div style={{ width: '100%', height: '8px', background: '#1a1a3a' }}>
                     <div style={{ width: `${widthPct}%`, height: '100%', background: i === 0 ? '#ffd700' : '#39ff14' }} />
                   </div>
                 </div>
               );
             })}
           </div>
        </div>

        {/* Highest Rated */}
        <div style={{ flex: '1 1 300px', background: '#0d0d1a', border: '2px solid #2a2a5a', padding: '24px' }}>
           <h3 className="pixel-font" style={{ fontSize: '8px', color: '#ff4444', marginBottom: '24px' }}>
             MELHORES NOTAS
           </h3>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {highestRated.length === 0 ? <p style={{ color: '#6060a0', fontFamily: "'VT323'" }}>Sem dados</p> : highestRated.map((game, i) => {
               const widthPct = (game.avgScore / 10) * 100;
               return (
                 <div key={game.slug}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                     <span style={{ fontFamily: "'VT323'", fontSize: '16px', color: i === 0 ? '#ffd700' : '#a0a0d0' }}>
                       {i + 1}. {game.title}
                     </span>
                     <span style={{ fontFamily: "'Press Start 2P'", fontSize: '8px', color: '#ff4444' }}>
                       {game.avgScore.toFixed(1)} <span style={{ color: '#6060a0' }}>/10</span>
                     </span>
                   </div>
                   <div style={{ width: '100%', height: '8px', background: '#1a1a3a' }}>
                     <div style={{ width: `${widthPct}%`, height: '100%', background: i === 0 ? '#ffd700' : '#ff4444' }} />
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>
    </div>
  );
}

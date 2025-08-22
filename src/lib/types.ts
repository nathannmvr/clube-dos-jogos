// src/lib/types.ts

export interface GameReview {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;

  gameTitle: string;
  gameSlug: string; // <-- ADICIONE ESTA LINHA

  createdAt: number; 
  
  scores: {
    jogabilidade: number;
    arte: number;
    trilhaSonora: number;
    diversao: number;
    rejogabilidade: number;
    graficos: number;
    complexidade: number;
    lore: number;
  };

  horasJogadas: number;
  notaFinal: number;
}
export interface GameReview {
  id: string; // Um ID único para cada review
  userId: string; // ID do usuário que fez a review
  userName: string; // Nome do usuário
  userImage?: string; // Foto do usuário (do login social)
  gameTitle: string;
  createdAt: number; // Data em formato timestamp para ordenação
  
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
  comentario?: string; // Um campo extra para texto livre
}
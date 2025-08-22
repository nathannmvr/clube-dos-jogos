export interface GameReview {
  id: string;
  userId: string; // ID do usuário do provedor de login
  userName: string; // Nome do usuário
  userImage?: string; // Imagem/Avatar do usuário

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
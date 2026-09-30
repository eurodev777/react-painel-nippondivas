export interface Atleta {
  id: string | number;
  nome: string;
  atleta_id?: string | number;
  id_atleta?: string | number;
}

export interface Equipe {
  id: string | number;
  nome: string;
  equipe_id?: string | number;
  id_equipe?: string | number;
  atletas: Atleta[];
}

export interface Categoria {
  id: string | number;
  categoria_id?: string | number;
  id_categoria?: string | number;
  titulo: string;
  equipes: Equipe[];
}

export interface ApiResponse {
  categorias: Categoria[];
}

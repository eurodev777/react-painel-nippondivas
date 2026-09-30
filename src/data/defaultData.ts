import { Categoria } from '../types';

export const DEFAULT_CATEGORIES: Categoria[] = [
  {
    id: 1,
    categoria_id: 1,
    titulo: "RELAÇÃO DOS ATLETAS - SUB-11",
    equipes: [
      {
        id: 10,
        equipe_id: 10,
        nome: "NIPPON BLUE SHARKS",
        atletas: [
          { id: 101, nome: "Enzo Silva (C)" },
          { id: 102, nome: "Mateus Hayashi" },
          { id: 103, nome: "Lucas Tanaka" },
          { id: 104, nome: "Thiago Santos" },
          { id: 105, nome: "Pedro Lima" }
        ]
      },
      {
        id: 11,
        equipe_id: 11,
        nome: "KYOTO EAGLES",
        atletas: [
          { id: 106, nome: "Felipe Mendes (C)" },
          { id: 107, nome: "Gabriel Sato" },
          { id: 108, nome: "Rodrigo Costa" },
          { id: 109, nome: "Yuji Nakamura" }
        ]
      },
      {
        id: 12,
        equipe_id: 12,
        nome: "TOKYO DRAGONS",
        atletas: [
          { id: 110, nome: "Bruno Souza" },
          { id: 111, nome: "Leo Kudo (C)" },
          { id: 112, nome: "Gustavo Rossi" }
        ]
      }
    ]
  },
  {
    id: 2,
    categoria_id: 2,
    titulo: "RELAÇÃO DOS ATLETAS - SUB-13",
    equipes: [
      {
        id: 20,
        equipe_id: 20,
        nome: "SAMURAI FC",
        atletas: [
          { id: 201, nome: "Murilo Oliveira (C)" },
          { id: 202, nome: "Daniel Abe" },
          { id: 203, nome: "Kael Santos" },
          { id: 204, nome: "Henrique Suzuki" }
        ]
      },
      {
        id: 21,
        equipe_id: 21,
        nome: "OSAKA TIGERS",
        atletas: [
          { id: 205, nome: "Arthur Rocha (C)" },
          { id: 206, nome: "Nicolas Yamada" },
          { id: 207, nome: "Vitor Barbosa" }
        ]
      }
    ]
  },
  {
    id: 3,
    categoria_id: 3,
    titulo: "RELAÇÃO DOS ATLETAS - VETERANOS",
    equipes: [
      {
        id: 30,
        equipe_id: 30,
        nome: "NIPPON MASTER OLD BOYS",
        atletas: [
          { id: 301, nome: "Roberto Suzuki (C)" },
          { id: 302, nome: "Carlos Watanabe" },
          { id: 303, nome: "Fernando Castro" },
          { id: 304, nome: "Marcos Yoshida" },
          { id: 305, nome: "Sergio Tanaka" }
        ]
      }
    ]
  }
];

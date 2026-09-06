export type GroupId = 'body' | 'doors' | 'glass' | 'interior' | 'engine' | 'mechanical' | 'wheels' | 'chassis' | 'trim';
export type Vector = [number, number, number];

export interface Piece {
  id: string;
  group: GroupId;
  label: string;
  descriptionKey: string;
  sourceObject: string;
  faces: number;
  min: Vector;
  max: Vector;
  center: Vector;
}

export interface Manifest {
  name: string;
  author: string;
  source: string;
  sourceYear: number;
  license: string;
  licenseUrl: string;
  changes: string;
  scope: string;
  objects: Piece[];
}

export const groups: { id: GroupId; name: string; subtitle: string; description: string; working: string }[] = [
  { id: 'body', name: 'Carroceria', subtitle: 'A silhueta que atravessa gerações',
    description: 'Teto arredondado, para-lamas destacados e capôs curvos. As superfícies que fazem a gente reconhecer um Fusca antes mesmo de ver o emblema.',
    working: 'A carroceria se une à plataforma por pontos de fixação. O capô dianteiro dá acesso ao porta-malas; a tampa traseira abre o compartimento do motor.' },
  { id: 'doors', name: 'Portas e dobradiças', subtitle: 'Entra que sempre cabe mais uma história',
    description: 'As duas portas laterais e os detalhes das articulações. Selecione uma peça para observar suas formas e a relação com a cabine.',
    working: 'Dobradiças sustentam as portas e permitem o giro de abertura. Fechaduras e batentes mantêm as portas fechadas; borrachas fazem a vedação.' },
  { id: 'glass', name: 'Vidros', subtitle: 'O mundo visto de dentro do besouro',
    description: 'Para-brisa, vidros laterais e janela traseira. Um conjunto de formas simples que acompanha as curvas da carroceria.',
    working: 'O para-brisa e o vidro traseiro ficam encaixados na carroceria. Nas portas, os vidros e os pequenos quebra-ventos ajudam na ventilação da cabine.' },
  { id: 'interior', name: 'Interior e painel', subtitle: 'Só o necessário. E muita memória.',
    description: 'Bancos, volante, painel e comandos do modelo. Um interior compacto, com detalhes que ficam mais fáceis de ver ao isolar o conjunto.',
    working: 'O volante comanda a direção. Pedais e alavancas permitem controlar aceleração, frenagem, embreagem e câmbio. O painel reúne os instrumentos de condução.' },
  { id: 'engine', name: 'Motor boxer', subtitle: 'O coração fica lá atrás',
    description: 'O motor traseiro do Fusca, com quatro cilindros opostos e refrigeração a ar. O asset inclui uma representação visual de seus componentes externos.',
    working: 'Os pistões trabalham em pares opostos. A ventoinha conduz ar pelo motor e suas aletas ajudam a dissipar calor. A transmissão leva o movimento às rodas traseiras.' },
  { id: 'mechanical', name: 'Suspensão e escape', subtitle: 'Entre a rua e o caminho',
    description: 'Elementos mecânicos sob a carroceria: suspensão, transmissão e escapamento, conforme a geometria disponível neste modelo.',
    working: 'A suspensão permite que as rodas acompanhem irregularidades do piso. O escapamento conduz os gases do motor e reduz o ruído por meio do silenciador.' },
  { id: 'wheels', name: 'Rodas e pneus', subtitle: 'Cromado, borracha e asfalto',
    description: 'Quatro pneus, rodas de aço e seus detalhes. As calotas cromadas foram acrescentadas nesta releitura para dar ao amarelinho aquele jeito familiar.',
    working: 'Os pneus fazem o contato com o solo. As rodas são fixadas aos cubos e transmitem os esforços de aceleração, direção e frenagem. As calotas cobrem o centro das rodas.' },
  { id: 'chassis', name: 'Plataforma', subtitle: 'A base de tudo',
    description: 'A estrutura inferior representada pelo artista. É a base visual sobre a qual se organizam a cabine e os componentes do carro.',
    working: 'No Fusca clássico, a plataforma e a carroceria são conjuntos unidos por fixações. A estrutura recebe as cargas dos ocupantes e as ligações com os conjuntos mecânicos.' },
  { id: 'trim', name: 'Faróis e acabamentos', subtitle: 'O charme mora nos detalhes',
    description: 'Faróis, lanternas, para-choques, frisos e pequenos acabamentos. Abra o seletor de peças para explorar cada elemento modelado.',
    working: 'Faróis iluminam o caminho e lanternas sinalizam a presença do carro. Frisos, suportes e para-choques completam o conjunto exterior.' },
];

export function assertManifest(value: unknown): asserts value is Manifest {
  if (!value || typeof value !== 'object' || !('objects' in value) || !Array.isArray(value.objects) || value.objects.length === 0 || value.objects.length > 2000) {
    throw new Error('O catálogo de peças não pôde ser lido.');
  }
  const ids = new Set<string>();
  for (const p of value.objects as Piece[]) {
    if (!p || typeof p.id !== 'string' || ids.has(p.id) || typeof p.label !== 'string' || !groups.some(g => g.id === p.group)
      || ![p.min, p.max, p.center].every(v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite))
      || p.min.some((v, i) => v > p.max[i])) {
      throw new Error('Há uma peça inválida no catálogo.');
    }
    ids.add(p.id);
  }
}

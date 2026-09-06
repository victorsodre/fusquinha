# Validação local — Fusquinha

Validado em 05/09/2026.

- `npm test`: 8 testes aprovados — integridade do catálogo, escala/orientação das placas, disposição de 515 elementos sem sobreposição de slots, enquadramento em três proporções limites da vibração, integridade dos conjuntos articulados, abertura da porta e duração real dos ciclos sonoros.
- `npm run build`: TypeScript e build de produção aprovados. Cena 3D carregada em módulo separado.
- `scripts/browser-check.js`: 21 verificações aprovadas em Chromium via Playwright CLI, sem erros de execução da página.
- Áudio: começa pausado, toca por ação do usuário, avança em tempo real, repete ao chegar ao final, permite silenciar sem desligar e para ao desligar.
- Iluminação e interface: HDRI carregado, sombra de contato atualizada por disposição e reaproveitada com o motor ligado; catálogo completo na primeira tela do desktop; visual de garagem brasileira conferido nos três tamanhos.
- Movimento: a vibração muda ao longo do tempo, retorna à posição de repouso ao desligar e respeita movimento reduzido. Não move a câmera e se atenua durante a desmontagem completa.
- Checagem adicional no canvas: arrastar orbita sem selecionar acidentalmente; clicar na geometria seleciona a peça por raycast.
- Interações: seleção de conjuntos/peças, isolamento, zoom, busca, montagem reversível, slider por teclado, nomes dos conjuntos e créditos acessíveis pelo rodapé e cabeçalho. Victor ocupa o primeiro crédito.
- Inspeção visual: desktop 1440 × 900, celular 390 × 844 e paisagem 844 × 390. O painel no celular reserva uma área própria e não cobre o viewport do modelo.

- `scripts/accessories-check.js`: oito verificações aprovadas — faróis/cliques, porta/sons de abertura e fechamento, limpadores/loop, alerta/relé, mudo global, movimento reduzido, desmontagem após abrir a porta e controles no celular. Sem erros da página ou console.
- Localidade verificada: Vitória, ES. Placas capixabas desenhadas pela aplicação.
- Recortes WAV conferidos: nenhum sample saturado e durações de 0,73 s (relé) e 1,40 s (limpadores), usadas como relógio da animação.
- Cenário: azulejos, cobogós e piso conferidos visualmente no desktop e no celular em pé/deitado. A transição das bordas é aplicada apenas ao material do piso. Ao redimensionar, a cena continua desenhando por 250 ms para estabilizar a composição do canvas antes de voltar ao repouso. Alternância entre as três proporções sem estouro horizontal ou erros da página.
- Exportação PNG conferida após tornar o canvas transparente: arquivo `fusquinha-amarelinho.png` com o modelo visível e fundo opaco.

## Registros

Capturas em `output/playwright/`: `desktop-assembled.png`, `desktop-engine-running.png`, `desktop-engine.png`, `desktop-all-pieces.png`, `desktop-labels.png`, `credits.png`, `mobile-assembled.png`, `mobile-engine.png` e `mobile-landscape.png`.

Versão final do cenário em `garage-desktop.png`, `garage-mobile.png`, `garage-landscape.png`, `garage-headlights.png` e `garage-export.png`.

A verificação móvel usa viewport de navegador, sem ensaio em aparelho físico. Os 515 elementos são partes de um modelo artístico; não validam precisão de fabricação. Condições de distribuição em [ASSETS.md](ASSETS.md).

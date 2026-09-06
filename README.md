# Fusquinha

Um Fusca amarelinho para explorar em 3D: órbita, zoom, seleção de conjuntos e peças, isolamento, malha, captura de imagem e desmontagem progressiva de 515 elementos.

**[Abrir o Fusquinha online](https://victorsodre.github.io/fusquinha/)**

Idealização e direção de **Victor** — [@ovictor no X](https://x.com/ovictor) e [@ovictorlab no YouTube](https://www.youtube.com/@ovictorlab).

Direção visual de garagem brasileira: azulejos verdes, cobogós, parede de cal, piso de pedra e amarelo solar. A cena combina luz de estúdio HDRI, reflexos PBR e sombras de contato.

Modelo original por **Rodrigo Marini**, reinterpretado com pintura amarela e calotas cromadas. Experiência inspirada no [Model X Studio de Ashe](https://github.com/ashemag/model-x-studio), com implementação própria em React, TypeScript e Three.js.

![Fusquinha amarelinho em uma garagem com azulejos verdes e cobogós](docs/images/fusquinha.png)

## Rodar localmente

Node.js 22.13+ e npm.

```sh
npm ci
npm run dev -- --port 3016
```

Abra http://127.0.0.1:3016.

O repositório e a publicação incluem código, GLB, sons, iluminação e cenário, conforme decisão expressa de Victor. Os assets de terceiros mantêm suas próprias licenças; a presença no repositório não os torna domínio público. Veja [origem e condições dos assets](docs/ASSETS.md).

## Publicação online

GitHub Pages serve o build da branch `gh-pages`. A branch `main` contém os fontes. Os caminhos relativos permitem carregar modelo, sons e iluminação em `/fusquinha/`.

Após revisar e fazer commit das mudanças nos fontes:

```sh
npm test
npm run build
python3 scripts/prepare-pages.py
git push origin main gh-pages
```

O script prepara somente a branch de publicação, preservando o checkout atual. O push de `gh-pages` atualiza o site. `release.json` identifica o commit dos fontes utilizado no build.

## Controles

- Arrastar: girar o carro; roda do mouse ou gesto de pinça: zoom.
- **Ligar motor**: toca o áudio fornecido por Victor em repetição e aplica uma vibração sutil à carroceria. O botão de som silencia o motor e todos os efeitos sem desligar; **Desligar motor** interrompe áudio e movimento.
- **Faróis**: acende as lentes, as lanternas traseiras e os fachos, com som de interruptor.
- **Porta**: abre/fecha a porta do motorista com vidro, retrovisor e acabamento, acompanhada pelos sons de abertura e fechamento.
- **Alerta**: pisca dianteiro/traseiro sincronizado ao relé. **Limpadores**: varredura sincronizada ao áudio e retorno ao repouso ao desligar.
- Catálogo ou clique no carro: selecionar conjunto/peça.
- Seletor de peças e **Isolar**: inspecionar elementos individuais.
- Controle **Desmontar**: de 0% montado, passando por conjuntos afastados, até todas as peças organizadas em 100%.
- `E`: montar/desmontar. `R`: reenquadrar. `/`: buscar. `Esc`: fechar painéis e sair do isolamento.
- Barra lateral: zoom, câmera, rotação automática, malha, imagem PNG e tela cheia quando suportada.

O motor começa desligado. O áudio original OGG acompanha uma versão MP3 de compatibilidade. A vibração é desativada quando o sistema pede movimento reduzido.

Som do motor: **Dušan Oblak / Work With Sounds / Technical Museum of Slovenia**, gravação de um Fusca 1600 de 1984, sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [Fonte no Wikimedia Commons](https://commons.wikimedia.org/wiki/File:WWS_VolkswagenBeetle8211engine.ogg). Seleção de Victor; sem cortes, com conversão MP3, repetição e volume de reprodução ajustado.

A animação respeita movimento reduzido, pausa em abas ocultas e limita a renderização ativa a aproximadamente 30 quadros/s. O motor para de renderizar quando a cena fica parada. O enquadramento acompanha isolamento, desmontagem e mudança de tamanho da tela.

## Verificação

```sh
npm test
npm run build
```

Os testes geométricos verificam identidades, posições finitas, separação de todas as peças e cobertura da câmera em três proporções. A validação visual e de interação usa Playwright; os registros ficam em `output/playwright/`.

## Pipeline do modelo

```sh
python3 scripts/download-source.py
blender --background --factory-startup --disable-autoexec --threads 2 --python scripts/prepare-model.py
blender --background --factory-startup --disable-autoexec --threads 2 --python scripts/export-model.py
```

O pipeline mantém o `.blend` de origem em `/private/tmp/fusca-source.blend`, separa suas ilhas e exporta `public/models/fusca.glb` com o manifesto correspondente. Scripts embutidos no asset ficam desativados. Nenhuma conta, segredo ou compra é necessária para o asset gratuito consultado.

O projeto é educativo e visual: as ilhas artísticas não equivalem a um catálogo OEM ou a um projeto de fabricação. A adaptação brasileira não implica fidelidade integral a um ano/modelo nacional.

## Efeitos sonoros

Os seis recortes de efeitos já estão disponíveis nesta entrega. Para refazê-los com FFmpeg a partir dos quatro MP3 fornecidos:

```sh
python3 scripts/prepare-sounds.py /caminho/para/fusquinha-sfx
```

Origens, créditos e tempos dos recortes: [SOUND-SOURCES.md](docs/SOUND-SOURCES.md).

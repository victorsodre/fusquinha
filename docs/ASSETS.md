# Origem e uso dos assets

## Fusca

- Autor: **Rodrigo Marini**, artista de São Paulo, Brasil.
- Título original: **VolksWagen Beetle**, descrito pelo autor como modelo de 1965 com interior, motor, suspensão e rodas.
- Página: https://www.blendkit.com/asset-gallery-detail/e8a58537-3114-4962-a5c5-60fdb0346f1c/
- Asset base ID: `e8a58537-3114-4962-a5c5-60fdb0346f1c`.
- Versão consultada: `cfd06193-0f4e-467e-8f94-7a1a7e9ebdff`.
- Licença retornada pela API em 05/09/2026: **Royalty Free**; asset gratuito.
- Termos: https://www.blendkit.com/docs/licenses/
- FAQ: https://www.blendkit.com/docs/licenses/licensing-faq/

O asset **não é domínio público nem CAD de fabricação**. O download autorizado foi feito pela API pública do BlenderKit, sem credencial, com um UUID de cena e a variante de texturas de 1K.

Os [termos de uso, artigo 5, itens 4 e 8](https://www.blendkit.com/terms-and-conditions-2026/), restringem a redistribuição do produto separado e sua entrega em formato aberto extraível. O GLB servido pelo navegador é extraível. Informado dessas condições, Victor solicitou expressamente incluir o GLB no repositório e publicar a experiência completa. Essa decisão não constitui autorização do titular nem altera a licença original. Os créditos de Rodrigo Marini permanecem na interface e nesta documentação.

Mudanças locais: pintura amarelo solar; quatro calotas cromadas e duas placas cenográficas FUS-1965 de autoria deste projeto, com a identificação ES · VITÓRIA desenhada pela aplicação; shaders PBR portáveis; separação das 511 ilhas originais; organização em nove conjuntos; nomes descritivos em português. Total: **515 elementos**. As calotas e placas são identificadas como `Fusquinha` no manifesto.

A origem do projeto é Vitória, ES. A identificação local das placas é definida em `src/project.ts` e desenhada no material 3D em tempo de execução. O GLB intermediário contém a textura anterior, substituída pela aplicação.

O veículo é uma releitura brasileira do asset de 1965. Não se afirma conformidade histórica integral com um ano/modelo brasileiro. Os nomes das pequenas ilhas são descrições visuais; não são códigos de peças de reposição. Não foram acrescentados motor ou suspensão fictícios: a geometria desses conjuntos vem do asset original.

## Inspiração da interface

Model X Studio de Ashe: https://github.com/ashemag/model-x-studio

Referência de experiência (órbita, isolamento e desmontagem), consultada visualmente e por inspeção. Implementação própria; nenhum arquivo de código ou asset do Model X foi copiado. O repositório consultado não apresentava licença de código.

## Cenário da garagem

Azulejos geométricos verdes, cobogós e textura de reboco desenhados para o Fusquinha em `public/scenery/`, com SVGs locais. O piso de pedras em `src/garage-floor.ts` usa textura gerada pela aplicação e recebe a iluminação dos faróis e as sombras do carro. Não há fotografia ou asset externo adicional no cenário. A parede se atenua durante a desmontagem e o isolamento para facilitar a leitura das peças.

## Outras fontes consultadas

- Iniciativa CrowdCAD de 2011: https://blog.grabcad.com/blog/2011/05/06/building-the-old-beetle-crowdcad-style/ — não foi possível confirmar um conjunto completo e uma licença para redistribuição; nenhuma peça dessa iniciativa foi incorporada.
- Catálogos oficiais: https://www.volkswagen-classic-parts.com/en_global/service/spare-part-catalogues.html
- Manuais históricos: https://www.thesamba.com/vw/archives/manuals/type1.php
- Tipografia: DM Sans e Manrope, Google Fonts, SIL Open Font License.
- Ícones: Lucide, ISC.

Não foram usados modelos extraídos de jogos comerciais.

## Som do motor

Arquivo selecionado e fornecido por Victor: `WWS_VolkswagenBeetle8211engine.ogg`, duração 54,76 segundos. Gravação por **Dušan Oblak**, creditada a **Work With Sounds / Technical Museum of Slovenia**. [Fonte no Wikimedia Commons](https://commons.wikimedia.org/wiki/File:WWS_VolkswagenBeetle8211engine.ogg), com [licença CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), confirmada em 06/09/2026. A descrição identifica o Fusca “Carlos”, fabricado no México em 1984, com motor de 1600 cm³; não é gravação autenticada do veículo de 1965 representado pelo modelo.

Cópia OGG em `public/audio/fusquinha-engine.ogg` e conversão MP3 em `public/audio/fusquinha-engine.mp3` para compatibilidade. Conteúdo integral, sem cortes; reprodução em loop com volume inicial de 40%. Autoria, fonte, licença e adaptações constam também dos créditos da interface. Victor é creditado pela seleção, não pela autoria da gravação. A licença permite adaptação e uso comercial com suas condições de atribuição.

## Iluminação

HDRI [Studio Small 09](https://polyhaven.com/a/studio_small_09), de Sergej Majboroda, Poly Haven, versão HDR 2K (~6 MB). Arquivo local: `public/lighting/studio_small_09_2k.hdr`. [Licença CC0](https://polyhaven.com/license), com redistribuição permitida. Crédito mantido no diálogo do projeto.

O ambiente fornece reflexos e iluminação indireta. Luz principal quente e preenchimento frio complementam o volume; uma passagem de profundidade de 512 px gera sombras de contato suavizadas e reaproveitadas até a disposição das peças mudar. O ambiente tem fallback para uma sala procedural se o HDRI não carregar.

## Efeitos dos comandos

Quatro efeitos CC0 fornecidos na pasta `youtube-ovictor/episodios/ep029-codex-meu-jeito/audio/fusquinha-sfx`, selecionados por Victor. Fontes, autores e recortes descritos em [SOUND-SOURCES.md](SOUND-SOURCES.md). A aplicação usa seis trechos locais em `public/audio/sfx/`, sem alterar os originais do episódio. São efeitos genéricos de automóveis, não gravações autenticadas deste modelo de Fusca.

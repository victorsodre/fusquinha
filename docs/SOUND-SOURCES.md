# Fusquinha — efeitos gratuitos

Quatro efeitos CC0, selecionados a pedido de Victor. Nenhum arquivo pago foi adquirido. Os modelos dos carros não são informados: estes efeitos não estão confirmados como gravações de Fusca.

Arquivos: MP3 HQ públicos disponibilizados pelo player/compartilhamento do Freesound. Não são os WAV/AIFF originais sem perdas (esses exigem login). Os MP3 de origem não receberam cortes ou normalização. Os derivados preparados para o Fusquinha e sua sincronização estão descritos abaixo.

| Arquivo | Autor | Fonte |
|---|---|---|
| farol-interruptor.mp3 | khenshom | https://freesound.org/people/khenshom/sounds/504954/ |
| pisca-rele.mp3 | MWsfx | https://freesound.org/people/MWsfx/sounds/574249/ |
| limpadores-parabrisa.mp3 | MyInnerWill | https://freesound.org/people/MyInnerWill/sounds/704508/ |
| porta-generica-abrir-fechar.mp3 | nmscher | https://freesound.org/people/nmscher/sounds/86232/ |

Licença de todos: CC0 1.0 — https://creativecommons.org/publicdomain/zero/1.0/ . As páginas dos quatro sons informam permissão para copiar, modificar e distribuir, inclusive comercialmente, sem autorização individual. Crédito não obrigatório, mas autores e fontes preservados acima.

O pisca foi gravado como seta; é candidato para sonorizar o alerta, não registro confirmado do pisca-alerta de um Fusca. O farol é o clique do interruptor. A porta gratuita substitui a opção paga do Fusca 1969, excluída por Victor.

## Edição para a aplicação

Derivados PCM WAV mono 44,1 kHz, sem perdas adicionais de codificação após decodificar os MP3 recebidos. Microfades de 3/4 ms nas bordas; os originais foram preservados na pasta do episódio. Os tempos abaixo são segundos no arquivo recebido.

| Uso | Início | Duração | Ganho do recorte |
|---|---:|---:|---:|
| Farol — ligar | 0,10 | 0,55 | 2× |
| Farol — desligar | 2,25 | 0,65 | 2× |
| Porta — abrir | 0,65 | 1,10 | 3× |
| Porta — fechar | 2,75 | 0,70 | 1× |
| Alerta — ciclo | 1,50 | 0,73 | 5× |
| Limpadores — ciclo | 1,63 | 1,40 | 1× |

O relé e os limpadores usam o tempo do áudio como relógio da animação. O fechamento inicia o som com atraso de 280 ms para aproximar a batida do encaixe da porta. Ganhos finais de reprodução definidos em `src/vehicle-sounds.ts`; mudo silencia todos os sons sem interromper a mecânica.

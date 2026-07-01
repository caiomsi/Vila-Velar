/*
  ─── CONFIGURAÇÃO DA LOJA ───────────────────────────────────

  Este arquivo conecta o site às duas abas da sua planilha.
  Você precisa preencher as duas URLs abaixo.

  ════════════════════════════════════════════════════════════
  PASSO 1 — CRIAR A PLANILHA DE PRODUTOS
  ════════════════════════════════════════════════════════════

  Crie uma planilha no Google Sheets. Na primeira aba (ex: "Produtos"),
  coloque estes cabeçalhos na linha 1:

    nome | categoria | preco | imagem | tamanhos | ativo | destaque | descricao

  Preencha os produtos a partir da linha 2:

    nome:       Camiseta Essencial
    categoria:  camisetas  (opções: camisetas, polos, camisas, calcas, bermudas, moletons, jaquetas)
    preco:      89.90
    imagem:     https://... (URL pública da foto do produto)
    tamanhos:   P:5,M:10,G:8,GG:3   (tamanho:quantidade, separados por vírgula)
    ativo:      TRUE   (TRUE = aparece na loja | FALSE = oculto)
    destaque:   FALSE  (TRUE = badge "Destaque" + aparece primeiro)
    descricao:  Camiseta de algodão premium...

  Para publicar essa aba:
    Arquivo → Compartilhar → Publicar na web
    → Selecione a aba "Produtos" e "Valores separados por vírgula (.csv)"
    → Clique em "Publicar" → Copie o link
    → Cole abaixo em SHEET_CSV_URL

  ════════════════════════════════════════════════════════════
  PASSO 2 — CRIAR A ABA DO BANNER
  ════════════════════════════════════════════════════════════

  Na mesma planilha, crie uma segunda aba chamada "Banner".
  Coloque exatamente assim (linha 1 = cabeçalho):

    configuracao  |  valor
    banner_1      |  https://... (URL da Foto 1 do carrossel)
    banner_2      |  https://... (URL da Foto 2 do carrossel)
    promo_texto   |  FRETE GRÁTIS ACIMA DE R$299 • USE VV10 • NOVA COLEÇÃO •

  Para publicar essa aba:
    Arquivo → Compartilhar → Publicar na web
    → Selecione a aba "Banner" e "Valores separados por vírgula (.csv)"
    → Clique em "Publicar" → Copie o link
    → Cole abaixo em BANNER_CSV_URL

  Para trocar o texto da faixa ou as fotos do banner no futuro:
  basta editar as células da aba Banner e recarregar o site.

  ════════════════════════════════════════════════════════════
  DICA — Como hospedar as fotos no Google Drive:
    1. Faça upload da foto no Google Drive
    2. Clique com botão direito → "Compartilhar"
    3. Altere para "Qualquer pessoa com o link pode ver"
    4. Copie o link (ex: https://drive.google.com/file/d/ID/view)
    5. Transforme em link direto:
       https://drive.google.com/uc?export=view&id=ID
    6. Use esse link direto na planilha
  ════════════════════════════════════════════════════════════
*/

// URL da aba de produtos (publicada como CSV)
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1Y_D5i4fSl2aMZhw0FVrQTu4ddrnHL9SXKc7DXPNEgsQ/export?format=csv&gid=750433431'

// URL da aba de banner (publicada como CSV)
const BANNER_CSV_URL = 'https://docs.google.com/spreadsheets/d/1Y_D5i4fSl2aMZhw0FVrQTu4ddrnHL9SXKc7DXPNEgsQ/export?format=csv&gid=1206966111'

// WhatsApp do lojista (código do país + número, sem espaços)
const WHATSAPP_NUMBER = '5534991458213'

// Texto padrão da faixa de promoção no topo
// (substitua aqui ou controle pela planilha com a chave promo_texto)
const PROMO_TEXT = 'FRETE GRÁTIS ACIMA DE R$299 • USE CÓDIGO VV10 — 10% OFF • NOVA COLEÇÃO 2025 DISPONÍVEL • TROCA FÁCIL E RÁPIDA • FRETE GRÁTIS ACIMA DE R$299 • USE CÓDIGO VV10 — 10% OFF • NOVA COLEÇÃO 2025 DISPONÍVEL •'

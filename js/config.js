/*
  ─── CONFIGURAÇÃO DA LOJA ───────────────────────────────────
  Edite este arquivo para conectar o site à sua planilha.

  PASSO A PASSO PARA CONFIGURAR O GOOGLE SHEETS:
  ─────────────────────────────────────────────
  1. Crie uma planilha no Google Sheets com os seguintes
     cabeçalhos na primeira linha (linha 1):

     nome | categoria | preco | imagem | tamanhos | ativo | destaque | descricao

  2. Preencha os produtos a partir da linha 2.
     Exemplos de valores:

     nome:       Camiseta Essencial
     categoria:  camisetas  (opções: camisetas, polos, camisas, calcas, bermudas, moletons, jaquetas)
     preco:      89.90
     imagem:     https://... (URL pública da foto)
     tamanhos:   P:5,M:10,G:8,GG:3   (tamanho:quantidade, separados por vírgula)
     ativo:      TRUE   (TRUE = aparece na loja, FALSE = oculto)
     destaque:   FALSE  (TRUE = badge "Destaque" + aparece primeiro)
     descricao:  Camiseta de algodão premium...

  3. Publique a planilha:
     Arquivo → Compartilhar → Publicar na web
     → Escolha "Documento inteiro" e "Valores separados por vírgula (.csv)"
     → Clique em "Publicar"
     → Copie o link gerado

  4. Cole o link abaixo no lugar de 'COLE_AQUI_A_URL_DA_PLANILHA'
  ─────────────────────────────────────────────────────────────
*/

const SHEET_CSV_URL = 'COLE_AQUI_A_URL_DA_PLANILHA'

const WHATSAPP_NUMBER = '5534991458213'

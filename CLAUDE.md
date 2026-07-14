# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## What this is

Vila Velar — a **real client** site (men's clothing store, client Claudio,
Uberlândia MG). All content is pt-BR. Static HTML/CSS/JS, no build step. See the root
`../CLAUDE.md` for shared conventions.

## Structure

`index.html` at root, `css/style.css`, `js/main.js`, `js/config.js` (the client-facing
config file — see below), images in `images/` (including `logo.jpg`,
`logo-mark-gold.png`). Deployed at `vilavelar.com.br` (see `CNAME`; `www` CNAME →
`caiomsi.github.io`).

## Design language

Yellow/black/white brand, São Paulo "Rua" editorial design direction.

## Backend — Google Sheets, not Supabase

**Supabase was removed** (commit `d055b04`) in favor of a simpler model the client can
self-serve: `js/config.js` points at two Google Sheets tabs published as CSV —
`SHEET_CSV_URL` (products: `nome, categoria, preco, imagem, tamanhos, ativo, destaque,
descricao`, with per-size stock like `P:5,M:10,G:8,GG:3`) and `BANNER_CSV_URL`
(banner carousel + promo ticker text). The client edits the sheet directly; the site
fetches and parses the CSV client-side. Pasted Google Drive image links are
auto-converted to a displayable format — don't "fix" that by asking for direct image
URLs instead. **Read the comment block at the top of `js/config.js`** before changing
the data model — it's the client-facing setup doc.

## Checkout — WhatsApp, real number

`WHATSAPP_NUMBER` in `js/config.js` is already a **real, live number**
(`5534999095679`) — unlike NEXO-Studio/Corretora-InHouse, this is not a placeholder.
Cart is slide-in, `localStorage`-persisted; checkout builds a pre-filled `wa.me`
message. No MSI-Forms integration — WhatsApp is the entire lead/order flow here.

# Ligar a base compartilhada (Supabase) — passo a passo para o Wesley

Leva uns 10 minutos. Depois disso, todos do grupo veem e editam **a mesma lista de sugestões** e **os mesmos relatórios de teste**.

## 1. Criar o projeto (grátis)
1. Acesse **supabase.com** → **Start your project** → entre com sua conta do GitHub (a mesma `wesleysimone`).
2. **New project**:
   - Name: `the-way`
   - Database password: crie uma senha forte e **guarde** (não vai no site)
   - Region: **South America (São Paulo)**
3. Espere uns 2 minutos até o projeto ficar pronto.

## 2. Criar as tabelas e funções
1. Abra o arquivo **`supabase/schema.sql`** deste projeto.
2. **Antes de colar**, troque os dois códigos da seção 1:
   - `TROQUE-EQUIPE` → um código para o grupo (ex.: `theway-equipe-7429`)
   - `TROQUE-ADMIN` → um código **só seu** (ex.: `wesley-adm-8613`), diferente do outro
3. No Supabase: menu **SQL Editor** → **New query** → cole tudo → **Run**. Deve aparecer "Success".

> Para trocar um código depois: SQL Editor →
> `update tw_priv.config set valor = 'novo-codigo' where chave = 'codigo_equipe';`

## 3. Copiar as 2 chaves para o site
1. No Supabase: **Project Settings → API** (ou **Data API**).
2. Copie:
   - **Project URL** (ex.: `https://abcdefgh.supabase.co`)
   - **anon public** key (um texto longo começando com `eyJ...`)
3. Cole em **`prototipo/js/config.js`**:
   ```js
   window.THEWAY_CONFIG = {
     supabaseUrl: 'https://abcdefgh.supabase.co',
     supabaseAnonKey: 'eyJhbGciOi...'
   };
   ```
4. Publique (ou me peça: "liga a base compartilhada com estas chaves").

> A chave **anon public** pode ficar no site: ela é pública por natureza. A proteção vem do **código da equipe**, que as funções do banco exigem. **Nunca** coloque a chave `service_role` no site.

## 4. Link para o grupo
Mande o link **com o código da equipe**. Quem abrir já entra sem digitar o código:

```
https://wesleysimone.github.io/the-way-bjj/?equipe=SEU-CODIGO-DA-EQUIPE
```

## 5. Você como administrador
No site: **💡 Sugestões → 🔑 Sou o administrador** → digite o **código do admin**. Com ele você:
- muda a situação de cada sugestão (com nota);
- marca **Realizada** (isso já libera para quem pediu conferir e aprovar);
- exclui duplicadas.

## Conferir se ligou
No topo da central de sugestões deve aparecer **🟢 Lista compartilhada** (antes era 🟡 Modo local).
As sugestões feitas antes em modo local ficam só no aparelho de quem fez. Se precisar, é só recadastrar.

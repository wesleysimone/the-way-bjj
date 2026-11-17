# Base compartilhada com MySQL (sem mensalidade extra)

**Decisão do Wesley (17/11/2026):** não usar o Supabase, para não criar despesa nem depender de mais um serviço. A base vai ser **MySQL**, o mesmo banco que ele já usa no serviço com o MySQL Workbench 8.0. Quando o site for para a hospedagem paga (HostGator ou Hostinger), tudo roda lá.

## Como funciona

```
Site (navegador) ──POST JSON──▶ servidor/api.php ──PDO──▶ MySQL (tabelas tw_sugestoes e tw_testes)
```

- O navegador **não fala direto com o MySQL**. Nenhum navegador consegue fazer isso, e não seria seguro. Quem fala com o banco é um arquivo PHP pequeno, o `servidor/api.php`, que guarda a senha do banco e aplica as regras.
- As regras são as mesmas do modo local:
  - sem o código da equipe, ninguém lê nem grava;
  - só o administrador muda a situação e exclui;
  - só quem cadastrou edita;
  - sugestão aprovada fica travada;
  - "Realizada" passa para "Aguardando aprovação";
  - pedir ajuste exige uma explicação.
- **Testado:** 39 de 39 verificações (`npm run testar-api`) e o fluxo completo pelo site.
  - O teste roda o PHP de verdade com um banco SQLite temporário.
  - **Ainda não foi testado contra um MySQL de verdade.** O SQL usado é simples, padrão MySQL 5.7/8 e MariaDB.

| Arquivo | Para quê |
|---|---|
| `servidor/api.php` | A API. Cria as tabelas sozinha na primeira chamada. |
| `servidor/config.exemplo.php` | Modelo da configuração: banco, senha e códigos. Copie para `config.php`. |
| `servidor/banco-mysql.sql` | As tabelas, para rodar no Workbench ou no phpMyAdmin, se preferir criar à mão. |
| `servidor/.htaccess` | Na hospedagem, impede que alguém abra o `config.php` pelo navegador. |
| `servidor/rodar-local.mjs` | Roda o site e a API no computador **sem instalar PHP** (os dados ficam num arquivo SQLite). |
| `servidor/testar-api.mjs` | Teste automático da API. |

## Custo
- **Agora: R$ 0.** O site continua no GitHub Pages, de graça.
- **Na hospedagem:** HostGator e Hostinger já incluem **PHP + MySQL + phpMyAdmin** em qualquer plano de site. Não tem custo além do plano que vocês já vão contratar para o site.

## O ponto de atenção (com sinceridade)
Para 3 ou 4 pessoas, **cada uma na sua casa**, verem a mesma lista, o banco precisa estar **na internet**. Um MySQL no seu computador só é visto por quem está na mesma rede (o mesmo Wi-Fi). Por isso:

| Fase | Como fica a lista de sugestões |
|---|---|
| **Hoje** (sem hospedagem) | Modo local: cada um guarda as suas e manda pelo **📤 Enviar → WhatsApp**. Para testar a lista compartilhada, use o seu computador (opção A abaixo). |
| **Quando contratar a hospedagem** | Sobe a pasta `servidor/` e a lista vira compartilhada para todos (opção B). |

## Opção A — no seu computador

**Jeito mais fácil (sem instalar nada além do Node):**
```bash
npm install
```
```bash
npm run local
```
Abra `http://localhost:8080/?equipe=equipe`. O código do administrador é `admin`.

Quem estiver **no mesmo Wi-Fi** abre `http://IP-DO-SEU-PC:8080/?equipe=equipe`. Para descobrir o IP, rode `ipconfig` e procure o "Endereço IPv4".

**Com o seu MySQL do Workbench** (precisa do PHP instalado):
1. Baixe o PHP para Windows em windows.php.net (versão "Thread Safe" em zip) e descompacte em `C:\php`.
2. No `C:\php\php.ini` (copie de `php.ini-development`), tire o `;` da frente de `extension=pdo_mysql` e de `extension_dir = "ext"`.
3. Copie `servidor/config.exemplo.php` para `servidor/config.php` e coloque o usuário e a senha do seu MySQL. Troque também os dois códigos.
4. No Workbench, rode `servidor/banco-mysql.sql` (ou deixe a API criar as tabelas).
5. Rode:
   ```bash
   C:\php\php.exe -S 0.0.0.0:8080 -t servidor
   ```
6. Em `prototipo/js/config.js`, coloque `apiUrl: 'http://localhost:8080/api.php'`. Abra o site com `python -m http.server 5173 --directory prototipo`.

## Opção B — na hospedagem (HostGator ou Hostinger)
1. **Criar o banco:**
   - HostGator: cPanel → **Bancos de dados MySQL**.
   - Hostinger: hPanel → **Bancos de Dados MySQL**.

   Crie o banco (ex.: `theway`) e um usuário com senha, e dê **todos os privilégios** desse usuário no banco. A hospedagem costuma colocar um prefixo no nome, como `seuusuario_theway`.
2. **Criar as tabelas:** phpMyAdmin → escolha o banco → aba **SQL** → cole o `banco-mysql.sql` **sem** as linhas `CREATE DATABASE` e `USE` → Executar. Se pular este passo, a API cria as tabelas sozinha.
3. **Subir os arquivos:** no Gerenciador de Arquivos, crie a pasta `public_html/api/` e envie `api.php`, `.htaccess` e o seu `config.php` preenchido:
   - host `localhost`;
   - o banco, o usuário e a senha do passo 1;
   - os seus códigos.
4. **Testar:** abra `https://seudominio.com.br/api/api.php`. Deve aparecer `{"ok":true,"dados":"THE WAY API no ar"}`.
5. **Ligar o site:** em `prototipo/js/config.js`, coloque `apiUrl: 'https://seudominio.com.br/api/api.php'` e publique. Ou me peça: **"liga a base MySQL com este endereço"**.
6. **Link para o grupo:** `https://wesleysimone.github.io/the-way-bjj/?equipe=SEU-CODIGO-DA-EQUIPE`. Se o site também for para a hospedagem, use `https://seudominio.com.br/?equipe=...`.

> **Segurança:** a senha do banco fica **só** no `config.php`, no servidor. Ela não vai para o GitHub (está no `.gitignore`) nem para o site. Quando o site tiver domínio próprio, troque `'origens' => ['*']` pelo endereço do site.

## Conferir se ligou
No topo da central de sugestões aparece **🟢 Lista compartilhada** (antes era 🟡 Modo local).

## E o sistema completo, depois?
Esse mesmo caminho (PHP + MySQL na hospedagem) serve para o sistema real: alunos, agenda, presença, pagamentos e graduações. A API cresce com novas funções no mesmo padrão, sem mudar de fornecedor.

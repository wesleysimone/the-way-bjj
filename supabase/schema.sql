-- =====================================================================
-- THE WAY — base compartilhada de SUGESTÕES e RELATÓRIOS DE TESTE
-- Rodar 1 vez no Supabase: Dashboard › SQL Editor › New query › colar › Run.
--
-- Segurança:
--  • As tabelas ficam FECHADAS (RLS ligado, sem políticas): ninguém lê/escreve direto.
--  • Todo acesso passa por funções (RPC) que exigem o CÓDIGO DA EQUIPE.
--  • Ações de administrador (mudar situação, excluir) exigem o CÓDIGO DO ADMIN (Wesley).
--  • Os códigos ficam num schema privado (tw_priv), que a API não expõe.
-- ⚠ ANTES DE RODAR: troque os dois códigos no final da seção 1.
-- =====================================================================

-- 1) Configuração privada (códigos de acesso)
create schema if not exists tw_priv;
revoke all on schema tw_priv from public;

create table if not exists tw_priv.config (
  chave text primary key,
  valor text not null
);
insert into tw_priv.config (chave, valor) values
  ('codigo_equipe', 'TROQUE-EQUIPE'),   -- ⚠ troque: vai no link enviado ao grupo
  ('codigo_admin',  'TROQUE-ADMIN')     -- ⚠ troque: só o Wesley sabe
on conflict (chave) do nothing;

-- 2) Tabelas
create table if not exists public.tw_sugestoes (
  id             bigint generated always as identity primary key,
  solicitante    text not null check (length(solicitante) between 1 and 80),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  area           text not null default 'Geral' check (length(area) <= 80),
  tela           text not null default '' check (length(tela) <= 200),
  onde           jsonb,                                   -- rastro do "marcar na tela"
  descricao      text not null check (length(descricao) between 3 and 3000),
  observacoes    text not null default '' check (length(observacoes) <= 3000),
  situacao       text not null default 'Pendente',
  enviada_em     timestamptz,
  enviada_por    text,
  aprovada_em    timestamptz,
  aprovada_por   text,
  apoios         text[] not null default '{}',            -- "eu também quero isso" (evita duplicar)
  afeta_aprovada bigint,                                  -- mexe em algo já aprovado (nº)
  historico      jsonb not null default '[]'::jsonb
);

create table if not exists public.tw_testes (
  id           bigint generated always as identity primary key,
  criado_em    timestamptz not null default now(),
  responsavel  text not null check (length(responsavel) between 1 and 80),
  tipo         text not null check (tipo in ('automatico', 'manual')),
  resumo       jsonb not null default '{}'::jsonb,
  relatorio    jsonb not null default '{}'::jsonb
);

alter table public.tw_sugestoes enable row level security;
alter table public.tw_testes    enable row level security;
-- sem políticas = acesso direto bloqueado; só pelas funções abaixo
revoke all on public.tw_sugestoes from anon, authenticated;
revoke all on public.tw_testes    from anon, authenticated;

-- 3) Funções auxiliares (privadas)
create or replace function tw_priv.nivel(p_codigo text) returns text
language sql stable security definer set search_path = tw_priv, public as $$
  select case
    when p_codigo is not null and p_codigo = (select valor from tw_priv.config where chave = 'codigo_admin')  then 'admin'
    when p_codigo is not null and p_codigo = (select valor from tw_priv.config where chave = 'codigo_equipe') then 'equipe'
    else null end;
$$;

create or replace function tw_priv.exigir(p_codigo text, p_admin boolean default false) returns text
language plpgsql stable security definer set search_path = tw_priv, public as $$
declare n text := tw_priv.nivel(p_codigo);
begin
  if n is null then raise exception 'Código de acesso inválido' using errcode = '28000'; end if;
  if p_admin and n <> 'admin' then raise exception 'Somente o administrador pode fazer isso' using errcode = '42501'; end if;
  return n;
end $$;

create or replace function tw_priv.hist(p_por text, p_de text, p_para text, p_nota text) returns jsonb
language sql immutable as $$
  select jsonb_build_object('em', now(), 'por', p_por, 'de', p_de, 'para', p_para, 'nota', coalesce(p_nota, ''));
$$;

-- 4) API (chamada pelo site via /rest/v1/rpc/<nome>)

-- quem sou eu? ('equipe' ou 'admin')
create or replace function public.tw_verificar(p_codigo text) returns text
language sql stable security definer set search_path = tw_priv, public as $$
  select tw_priv.exigir(p_codigo);
$$;

create or replace function public.tw_sug_listar(p_codigo text) returns setof public.tw_sugestoes
language plpgsql stable security definer set search_path = public, tw_priv as $$
begin
  perform tw_priv.exigir(p_codigo);
  return query select * from public.tw_sugestoes order by id;
end $$;

create or replace function public.tw_sug_criar(
  p_codigo text, p_solicitante text, p_descricao text,
  p_area text default 'Geral', p_tela text default '', p_onde jsonb default null,
  p_observacoes text default '', p_afeta bigint default null
) returns public.tw_sugestoes
language plpgsql security definer set search_path = public, tw_priv as $$
declare r public.tw_sugestoes;
begin
  perform tw_priv.exigir(p_codigo);
  insert into public.tw_sugestoes (solicitante, descricao, area, tela, onde, observacoes, afeta_aprovada, historico)
  values (trim(p_solicitante), trim(p_descricao), coalesce(nullif(trim(p_area), ''), 'Geral'), coalesce(p_tela, ''), p_onde,
          coalesce(p_observacoes, ''), p_afeta, jsonb_build_array(tw_priv.hist(trim(p_solicitante), null, 'Pendente', 'Criada')))
  returning * into r;
  return r;
end $$;

-- edita a própria sugestão (ou admin). Aprovadas ficam travadas.
create or replace function public.tw_sug_editar(
  p_codigo text, p_id bigint, p_nome text, p_descricao text, p_observacoes text default null, p_area text default null
) returns public.tw_sugestoes
language plpgsql security definer set search_path = public, tw_priv as $$
declare n text := tw_priv.exigir(p_codigo); r public.tw_sugestoes;
begin
  select * into r from public.tw_sugestoes where id = p_id for update;
  if not found then raise exception 'Sugestão % não existe', p_id; end if;
  if r.situacao = 'Aprovada' then raise exception 'Sugestão % já foi aprovada e está travada', p_id; end if;
  if n <> 'admin' and lower(r.solicitante) <> lower(trim(p_nome)) then
    raise exception 'Só % (quem cadastrou) ou o administrador podem editar', r.solicitante;
  end if;
  update public.tw_sugestoes set
    descricao = coalesce(nullif(trim(p_descricao), ''), descricao),
    observacoes = coalesce(p_observacoes, observacoes),
    area = coalesce(nullif(trim(p_area), ''), area),
    atualizado_em = now()
  where id = p_id returning * into r;
  return r;
end $$;

-- "eu também quero isso": apoia uma sugestão existente em vez de duplicar
create or replace function public.tw_sug_apoiar(p_codigo text, p_id bigint, p_nome text) returns public.tw_sugestoes
language plpgsql security definer set search_path = public, tw_priv as $$
declare r public.tw_sugestoes;
begin
  perform tw_priv.exigir(p_codigo);
  update public.tw_sugestoes
     set apoios = case when trim(p_nome) = any(apoios) or lower(solicitante) = lower(trim(p_nome)) then apoios else apoios || trim(p_nome) end,
         atualizado_em = now()
   where id = p_id returning * into r;
  if not found then raise exception 'Sugestão % não existe', p_id; end if;
  return r;
end $$;

-- envia todas as sugestões PENDENTES de quem chamou → situação "Enviada"
create or replace function public.tw_sug_enviar(p_codigo text, p_nome text) returns integer
language plpgsql security definer set search_path = public, tw_priv as $$
declare qtd integer;
begin
  perform tw_priv.exigir(p_codigo);
  update public.tw_sugestoes
     set situacao = 'Enviada', enviada_em = now(), enviada_por = trim(p_nome), atualizado_em = now(),
         historico = historico || tw_priv.hist(trim(p_nome), 'Pendente', 'Enviada', null)
   where situacao = 'Pendente' and lower(solicitante) = lower(trim(p_nome));
  get diagnostics qtd = row_count;
  return qtd;
end $$;

-- ADMIN: muda a situação. "Realizada" já vai para "Aguardando aprovação" do solicitante.
create or replace function public.tw_sug_status(p_codigo text, p_id bigint, p_situacao text, p_nota text default '', p_por text default 'Administrador')
returns public.tw_sugestoes
language plpgsql security definer set search_path = public, tw_priv as $$
declare r public.tw_sugestoes; destino text := p_situacao; h jsonb;
begin
  perform tw_priv.exigir(p_codigo, true);
  if p_situacao not in ('Pendente', 'Enviada', 'Em análise', 'Em desenvolvimento', 'Realizada', 'Aguardando aprovação', 'Aprovada', 'Reprovada — necessita de ajuste') then
    raise exception 'Situação inválida: %', p_situacao;
  end if;
  select * into r from public.tw_sugestoes where id = p_id for update;
  if not found then raise exception 'Sugestão % não existe', p_id; end if;
  h := jsonb_build_array(tw_priv.hist(p_por, r.situacao, p_situacao, p_nota));
  if p_situacao = 'Realizada' then
    destino := 'Aguardando aprovação';
    h := h || tw_priv.hist(p_por, 'Realizada', destino, 'Liberada para conferência do solicitante');
  end if;
  update public.tw_sugestoes set situacao = destino, atualizado_em = now(), historico = historico || h,
         aprovada_em = case when destino = 'Aprovada' then now() else aprovada_em end,
         aprovada_por = case when destino = 'Aprovada' then p_por else aprovada_por end
   where id = p_id returning * into r;
  return r;
end $$;

-- conferência: aprovar ou pedir novo ajuste (só quando está "Aguardando aprovação")
create or replace function public.tw_sug_aprovar(p_codigo text, p_id bigint, p_nome text, p_aprovado boolean, p_nota text default '')
returns public.tw_sugestoes
language plpgsql security definer set search_path = public, tw_priv as $$
declare r public.tw_sugestoes; destino text;
begin
  perform tw_priv.exigir(p_codigo);
  select * into r from public.tw_sugestoes where id = p_id for update;
  if not found then raise exception 'Sugestão % não existe', p_id; end if;
  if r.situacao <> 'Aguardando aprovação' then raise exception 'Sugestão % não está aguardando aprovação (está: %)', p_id, r.situacao; end if;
  if not p_aprovado and coalesce(trim(p_nota), '') = '' then raise exception 'Explique o que ainda precisa ajustar'; end if;
  destino := case when p_aprovado then 'Aprovada' else 'Reprovada — necessita de ajuste' end;
  update public.tw_sugestoes set situacao = destino, atualizado_em = now(),
         aprovada_em = case when p_aprovado then now() else null end,
         aprovada_por = case when p_aprovado then trim(p_nome) else null end,
         historico = historico || tw_priv.hist(trim(p_nome), r.situacao, destino, p_nota)
   where id = p_id returning * into r;
  return r;
end $$;

-- ADMIN: excluir (ex.: duplicada)
create or replace function public.tw_sug_excluir(p_codigo text, p_id bigint) returns boolean
language plpgsql security definer set search_path = public, tw_priv as $$
begin
  perform tw_priv.exigir(p_codigo, true);
  delete from public.tw_sugestoes where id = p_id;
  return found;
end $$;

-- relatórios de teste
create or replace function public.tw_teste_salvar(p_codigo text, p_responsavel text, p_tipo text, p_resumo jsonb, p_relatorio jsonb)
returns bigint
language plpgsql security definer set search_path = public, tw_priv as $$
declare novo bigint;
begin
  perform tw_priv.exigir(p_codigo);
  insert into public.tw_testes (responsavel, tipo, resumo, relatorio)
  values (trim(p_responsavel), p_tipo, coalesce(p_resumo, '{}'::jsonb), coalesce(p_relatorio, '{}'::jsonb))
  returning id into novo;
  return novo;
end $$;

create or replace function public.tw_teste_listar(p_codigo text)
returns table (id bigint, criado_em timestamptz, responsavel text, tipo text, resumo jsonb)
language plpgsql stable security definer set search_path = public, tw_priv as $$
begin
  perform tw_priv.exigir(p_codigo);
  return query select t.id, t.criado_em, t.responsavel, t.tipo, t.resumo from public.tw_testes t order by t.id desc limit 200;
end $$;

create or replace function public.tw_teste_obter(p_codigo text, p_id bigint) returns jsonb
language plpgsql stable security definer set search_path = public, tw_priv as $$
declare r jsonb;
begin
  perform tw_priv.exigir(p_codigo);
  select t.relatorio into r from public.tw_testes t where t.id = p_id;
  return r;
end $$;

-- 5) Permissões: o site (papel "anon") só pode EXECUTAR as funções públicas
-- (as funções públicas rodam como o dono do banco, então o site não precisa de acesso ao schema tw_priv)
revoke all on all functions in schema tw_priv from public;
grant execute on function
  public.tw_verificar(text),
  public.tw_sug_listar(text),
  public.tw_sug_criar(text, text, text, text, text, jsonb, text, bigint),
  public.tw_sug_editar(text, bigint, text, text, text, text),
  public.tw_sug_apoiar(text, bigint, text),
  public.tw_sug_enviar(text, text),
  public.tw_sug_status(text, bigint, text, text, text),
  public.tw_sug_aprovar(text, bigint, text, boolean, text),
  public.tw_sug_excluir(text, bigint),
  public.tw_teste_salvar(text, text, text, jsonb, jsonb),
  public.tw_teste_listar(text),
  public.tw_teste_obter(text, bigint)
to anon, authenticated;
-- a tabela de códigos nunca é lida direto
revoke all on tw_priv.config from anon, authenticated;

// Painel de Juros: telas do celular e do PC.
// Funcionamento: (1) celular publicado: login no Supabase e leitura do resumo (documentos.slug='resumo');
// (2) PC local: se existir window.RESUMO_LOCAL, não há login nem Supabase.
// Nenhum dado financeiro fica neste arquivo: tudo vem do resumo, em tempo de execução.
const SUPA_URL = 'https://gmbbrxwfltzcuuxyvjrh.supabase.co';
const SUPA_KEY = 'sb_publishable_mZ7vxtenirrRtDFDv03ZRw_sRypoOrJ';   // chave pública: sem login não lê nada
const LOCAL = (typeof window.RESUMO_LOCAL === 'object' && window.RESUMO_LOCAL) ? window.RESUMO_LOCAL : null;
const sb = (!LOCAL && window.supabase) ? supabase.createClient(SUPA_URL, SUPA_KEY, {auth:{persistSession:true, autoRefreshToken:true}}) : null;
const $ = id => document.getElementById(id);
const msg = (t, tipo='') => { $('msg').textContent = t; $('msg').className = 'msg ' + tipo; };
const cache = {};
const AJUSTE_CSS = '<style id="ajusteCelular">\nhtml,body{overflow-x:hidden!important;max-width:100vw;touch-action:pan-y pinch-zoom;overscroll-behavior:none}\n.grid>*{min-width:0}\ninput[type=range]{max-width:100%;margin-left:0;margin-right:0}\n@media (max-width:640px){\n  .tw{overflow-x:visible!important}\n  table.cartao,table.cartao tbody,table.cartao tr,table.cartao td,table.cartao th{display:block;width:auto!important}\n  table.cartao tr.cab{display:none}\n  table.cartao tr{border:1px solid var(--line,#4a505a);border-radius:8px;margin:0 0 8px;padding:6px 10px}\n  table.cartao td{display:flex;justify-content:space-between;align-items:baseline;gap:10px;border:0!important;padding:3px 0!important;text-align:right!important;white-space:normal!important;overflow-wrap:anywhere}\n  table.cartao td::before{content:attr(data-label);color:var(--fg2,#9aa0a8);text-align:left;font-weight:500;flex:0 0 46%}\n  table.cartao td[data-label=""]::before{display:none}\n  table.cartao td:first-child{font-weight:650;justify-content:flex-start;text-align:left!important;border-bottom:1px solid var(--line,#4a505a)!important;padding-bottom:5px!important;margin-bottom:3px}\n  table.cartao td:first-child::before{display:none}\n  canvas{max-width:100%!important}\n}\n</style>';
const AJUSTE_JS = "<script>\n(function(){\n  if (window.innerWidth > 640) return;\n  function cartoes(){\n    document.querySelectorAll('table').forEach(function(t){\n      var rows = Array.prototype.slice.call(t.rows); if (!rows.length) return;\n      var hr = rows.find(function(r){ return r.querySelector('th') && !r.querySelector('td'); });\n      if (!hr) return;\n      hr.classList.add('cab');\n      var heads = Array.prototype.map.call(hr.cells, function(c){ return c.textContent.trim(); });\n      rows.forEach(function(r){ if (r === hr) return;\n        Array.prototype.forEach.call(r.cells, function(c, i){\n          if (c.tagName === 'TD' && !c.hasAttribute('data-label')) c.setAttribute('data-label', heads[i] || ''); }); });\n      t.classList.add('cartao');\n    });\n  }\n  var pend = null;\n  new MutationObserver(function(){ clearTimeout(pend); pend = setTimeout(cartoes, 60); })\n    .observe(document.body, {childList:true, subtree:true});\n  window.addEventListener('load', cartoes); cartoes();\n})();\n<\/script>";

// ====================================================================================================
// 1. LISTA ÚNICA DE TELAS (fonte da verdade: o menu, a barra inferior e o título saem daqui)
// ====================================================================================================
const ICONES = {
  swap:     '<path d="M4 8h13m0 0-3.5-3.5M17 8l-3.5 3.5M20 16H7m0 0 3.5-3.5M7 16l3.5 3.5"/>',
  carteira: '<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 7l2-3h10l2 3M16 14h2"/>',
  novo:     '<path d="M12 5v14M5 12h14"/>',
  diario:   '<path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6zM6 3v18M10 8h5M10 12h5"/>',
  pedir:    '<path d="M4 6h16v12H4zM4 7l8 6 8-6"/>',
  enviar:   '<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 16v3h14v-3"/>',
  tecnico:  '<path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/>',
  cenarios: '<path d="M3 17l5-6 4 3 4-7 5 5M3 21h18"/>',
  panorama: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>',
  dados:    '<path d="M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  mais:     '<path d="M4 7h16M4 12h16M4 17h16"/>',
};
const svg = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[k]}</svg>`;
const TELAS = [
  {id:'s30a',     rot:'2030 menor',          grupo:'Seus swaps',   icone:'swap',     barra:true, tipo:'swap', dados:true},
  {id:'s35',      rot:'2035',                grupo:'Seus swaps',   icone:'swap',     barra:true, tipo:'swap', dados:true},
  {id:'s30b',     rot:'2030 maior',          grupo:'Seus swaps',   icone:'swap',     barra:true, tipo:'swap', dados:true},
  {id:'carteira', rot:'Carteira',            grupo:'Seus swaps',   icone:'carteira', barra:true, tipo:'carteira', dados:true},
  {id:'novo',     rot:'Novo swap',           grupo:'Mercado e novo swap',icone:'novo',     tipo:'novo', dados:true, destaque:true},
  {id:'inflacao', rot:'Inflação e juros',    grupo:'Mercado e novo swap',icone:'cenarios', tipo:'inflacao', dados:true},
  {id:'diario',   rot:'Diário do assessor',  grupo:'Assessor',     icone:'diario',   tipo:'diario', login:true},
  {id:'roteiro',  rot:'O que pedir ao banco',grupo:'Assessor',     icone:'pedir',    tipo:'roteiro'},
  {id:'enviar',   rot:'Enviar',              grupo:'Assessor',     icone:'enviar',   tipo:'enviar', login:true},
  {id:'painel',   rot:'Painel técnico',      grupo:'Técnico',      icone:'tecnico',  tipo:'doc', login:true},
  {id:'cenarios', rot:'Cenários',            grupo:'Técnico',      icone:'cenarios', tipo:'doc', login:true},
  {id:'panorama', rot:'Panorama',            grupo:'Técnico',      icone:'panorama', tipo:'doc', login:true},
  {id:'dados',    rot:'Dados',               grupo:'Técnico',      icone:'dados',    tipo:'dados', login:true},
];
const TELA_INICIAL = 's30a';
const CHAVE_ABA = 'abaSwapsV2';
let ATUAL = null;

function montarNav(){
  const grupos = [];
  TELAS.forEach(t => { let g = grupos.find(x => x.n === t.grupo); if (!g) { g = {n:t.grupo, itens:[]}; grupos.push(g); } g.itens.push(t); });
  $('nav').innerHTML = grupos.map(g =>
    `<div class="grp${g.itens.every(t => t.barra) ? ' g-barra' : ''}">${esc(g.n)}</div>` +
    g.itens.map(t => `<button type="button" data-s="${t.id}" class="${t.barra ? 'na-barra' : ''}${t.destaque ? ' destaque' : ''}">${svg(t.icone)}<span>${esc(t.rot)}</span></button>`).join('')
  ).join('');
  $('barra').innerHTML = TELAS.filter(t => t.barra).map(t => `<button type="button" data-s="${t.id}">${svg(t.icone)}<span>${esc(t.rot)}</span></button>`).join('')
    + `<button type="button" data-mais="1">${svg('mais')}<span>Mais</span></button>`;
  $('nav').querySelectorAll('button').forEach(b => b.onclick = () => abrir(b.dataset.s));
  $('barra').querySelectorAll('button').forEach(b => b.onclick = () => {
    if (b.dataset.mais) return document.body.classList.toggle('menu');
    abrir(b.dataset.s);
  });
}
function marcarNav(){
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.s === ATUAL));
  let achou = false;
  $('barra').querySelectorAll('button[data-s]').forEach(b => { const on = b.dataset.s === ATUAL; b.classList.toggle('on', on); if (on) achou = true; });
  const mais = $('barra').querySelector('[data-mais]'); if (mais) mais.classList.toggle('on', !achou);   // tela fora da barra: acende o "Mais"
}
const fechaPaineis = () => document.body.classList.remove('menu');
$('veu').onclick = fechaPaineis;
document.addEventListener('keydown', e => { if (e.key === 'Escape') fechaPaineis(); });

// tema claro/escuro
function aplicarTema(t){
  document.documentElement.dataset.theme = t;
  $('tema').textContent = t === 'dark' ? 'Tema claro' : 'Tema escuro';
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t === 'dark' ? '#2a2e35' : '#f6f5f2';
}
$('tema').onclick = () => {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('swapsTema', t); } catch(e) {}
  aplicarTema(t);
  if (ATUAL) redesenharGraficos();
};

// ====================================================================================================
// 2. FORMATAÇÃO
// ====================================================================================================
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num = v => typeof v === 'number' && isFinite(v);
const nf0 = v => Math.abs(Math.round(v)).toLocaleString('pt-BR');
const fR  = v => num(v) ? 'R$ ' + nf0(v) : '—';                                  // sem sinal
const fRs = v => !num(v) ? '—' : (Math.round(v) < 0 ? '−' : Math.round(v) > 0 ? '+' : '') + 'R$ ' + nf0(v);   // com sinal
const fR2 = v => 'R$ ' + Math.abs(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});
const fPct = v => num(v) ? v.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}) + '%' : '—';
const fPP = v => { if (!num(v)) return '—'; const a = Math.abs(v); return a.toLocaleString('pt-BR', {maximumFractionDigits:2}) + (a >= 2 ? ' pontos' : ' ponto'); };
const fD = iso => iso ? String(iso).slice(0,10).split('-').reverse().join('/') : '—';
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const fMA = iso => { const p = String(iso).slice(0,10).split('-'); return MESES[+p[1]-1] + '/' + p[0].slice(2); };
const cor = v => !num(v) || Math.round(v) === 0 ? '' : (v < 0 ? 'neg' : 'pos');
const pagaRec = v => !num(v) ? '—' : (Math.round(v) < 0 ? 'pagar ' + fR(v) : Math.round(v) > 0 ? 'receber ' + fR(v) : 'R$ 0');
// faixa de probabilidade: nunca um número só quando há intervalo
function faixa(f){
  if (!f || !num(f.min) || !num(f.max)) return '—';
  const lo = Math.round(f.min * 100), hi = Math.round(f.max * 100);
  if (hi === 0) return 'menos de 1%';
  if (lo === hi) return 'cerca de ' + lo + '%';
  return 'entre ' + lo + '% e ' + hi + '%';
}
function barraFaixa(f){
  if (!f || !num(f.min) || !num(f.max)) return '';
  const w = Math.max((f.max - f.min) * 100, 1.6), l = Math.min(Math.max(f.min * 100, 0), 100 - w);
  return `<div class="trilho" aria-hidden="true"><i style="left:${l.toFixed(2)}%;width:${w.toFixed(2)}%"></i></div><div class="esc" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>`;
}
// resultado em reais que muda conforme a hipótese: mostra também a faixa
const fxTxt = f => (f && num(f.min) && num(f.max) && Math.round(f.min) !== Math.round(f.max)) ? ` (de ${fRs(f.min)} a ${fRs(f.max)}, conforme a hipótese)` : '';
const faixaCurta = f => { if (!f || !num(f.min) || !num(f.max)) return '—'; const lo = Math.round(f.min * 100), hi = Math.round(f.max * 100); return lo === hi ? lo + '%' : lo + '% a ' + hi + '%'; };
const saud = () => { const h = new Date().getHours(); return h < 12 ? 'bom dia' : h < 18 ? 'boa tarde' : 'boa noite'; };
const fMin = v => v === 0 ? 'R$ 0,00 (sem perda)' : (v < 0 ? `−${fR2(v)} (perda máxima de ${fR2(v)})` : `+${fR2(v)}`);

// ====================================================================================================
// 3. LOGIN (como antes)
// ====================================================================================================
async function iniciar(){
  if (!sb) { $('login').classList.remove('hidden'); msg('Não foi possível carregar o serviço de login. Verifique a internet e recarregue.', 'err'); return; }
  const { data:{ session } } = await sb.auth.getSession();
  if (session) mostrarApp(); else { $('login').classList.remove('hidden'); $('app').classList.add('hidden'); }
}
$('entrar').onclick = async () => {
  msg('Entrando…');
  const { error } = await sb.auth.signInWithPassword({ email:$('email').value.trim(), password:$('senha').value });
  if (error) return msg(error.message.includes('Email not confirmed') ? 'Confirme o e-mail pelo link que o Supabase enviou.' : 'E-mail ou senha inválidos.', 'err');
  mostrarApp();
};
$('criar').onclick = async () => {
  if ($('senha').value.length < 10) return msg('Use uma senha com pelo menos 10 caracteres.', 'err');
  msg('Criando acesso…');
  const { error } = await sb.auth.signUp({ email:$('email').value.trim(), password:$('senha').value,
    options:{ emailRedirectTo: location.origin + location.pathname } });
  if (error) return msg('Não foi possível criar: ' + error.message, 'err');
  msg('Pronto. Abra o e-mail de confirmação do Supabase, clique no link e depois entre aqui.', 'ok');
};
$('sair').onclick = async () => { if (sb) await sb.auth.signOut(); location.reload(); };
// atalho na tela inicial: https://asalesr.github.io/painel-swaps/#encerrar

function telaSalva(){
  let v = TELA_INICIAL; try { v = localStorage.getItem(CHAVE_ABA) || TELA_INICIAL; } catch(e) {}
  return TELAS.some(t => t.id === v) ? v : TELA_INICIAL;
}
function mostrarApp(){
  $('login').classList.add('hidden'); $('app').classList.remove('hidden');
  aplicarTema(document.documentElement.dataset.theme || 'dark');
  montarNav();
  carregarResumo().then(() => { if (ATUAL && !['doc','dados','enviar'].includes(telaAtual().tipo)) abrir(ATUAL); });
  if (location.hash === '#encerrar') return abrir('painel', true);
  abrir(telaSalva());
}
function mostrarAppLocal(){
  document.body.classList.add('local');
  $('login').classList.add('hidden'); $('app').classList.remove('hidden');
  $('sair').classList.add('hidden');
  aplicarTema(document.documentElement.dataset.theme || 'dark');
  montarNav();
  R = prepararResumo(LOCAL); RESUMO_ESTADO = 'ok';
  abrir(telaSalva());
}
const telaAtual = () => TELAS.find(t => t.id === ATUAL) || TELAS[0];
const fdt = s => new Date(s).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'});

// ====================================================================================================
// 4. RESUMO (dados das telas simples)
// ====================================================================================================
let R = null, RESUMO_ESTADO = 'carregando', RESUMO_ERRO = '', VELHO = null;
// dado velho: já existe dia útil posterior à data dos dados cujo fechamento deveria ter entrado (o dado do dia sai à noite)
function dadoVelho(r){
  const ag = new Date(), iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  const lim = new Date(ag); if (ag.getHours() < 21) lim.setDate(lim.getDate() - 1);
  const esperados = (r.dias_uteis_seguintes || []).filter(d => d <= iso(lim));
  return esperados.length ? esperados[esperados.length - 1] : null;
}
function prepararResumo(raw){
  const r = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!r || typeof r !== 'object' || !Array.isArray(r.swaps)) throw new Error('formato inesperado');
  VELHO = dadoVelho(r);
  return r;
}
async function carregarResumo(){
  if (LOCAL) return;
  RESUMO_ESTADO = 'carregando';
  try {
    const { data, error } = await sb.from('documentos').select('html, atualizado_em').eq('slug', 'resumo').maybeSingle();
    if (error) { RESUMO_ESTADO = 'erro'; RESUMO_ERRO = error.message; return; }
    if (!data || !data.html) { RESUMO_ESTADO = 'ausente'; return; }
    R = prepararResumo(data.html); RESUMO_ESTADO = 'ok';
  } catch (e) { RESUMO_ESTADO = 'erro'; RESUMO_ERRO = 'O resumo enviado pelo PC está ilegível (' + (e.message || e) + ').'; }
}
const swapPorId = id => R && (R.swaps || []).find(s => s.id === id);
const SEM = {
  aguardar:  {t:'AINDA NÃO DÁ PARA SAIR SEM PERDA', c:'Ainda não dá'},
  perto:     {t:'PERTO DA META', c:'Perto da meta'},
  cotar:     {t:'NA META: PEÇA A COTAÇÃO AO BANCO', c:'Na meta: pedir cotação'},
  sair:      {t:'PASSOU DA META: PEÇA A SAÍDA', c:'Passou da meta'},
  bloqueado: {t:'SEM SINAL NO MOMENTO', c:'Sem sinal'},
  velho:     {t:'DADO ANTIGO: SEM SINAL CONFIÁVEL', c:'Dado antigo'},
};
function statusEf(s){ if (VELHO && s.status !== 'bloqueado') return 'velho'; return SEM[s.status] ? s.status : 'bloqueado'; }
function motivoEf(s){
  if (VELHO && s.status !== 'bloqueado') return s.motivo || `os dados são de ${fD(R.data_curva)}; atualize antes de decidir`;
  return s.motivo || '';
}
function vazioResumo(){
  if (RESUMO_ESTADO === 'carregando') return '<div class="card"><p>Carregando o resumo…</p></div>';
  if (RESUMO_ESTADO === 'ausente') return '<div class="card"><h2>Resumo ainda não enviado pelo PC</h2><p class="mut">Assim que o PC enviar, as telas dos swaps aparecem aqui. As telas técnicas (menu “Mais”) continuam funcionando.</p></div>';
  if (RESUMO_ESTADO === 'erro') return `<div class="card"><h2>Não foi possível ler o resumo</h2><p class="mut">${esc(RESUMO_ERRO)}</p></div>`;
  return '<div class="card"><p>Sem dados.</p></div>';
}
function renderFaixa(t){
  const el = $('faixa');
  if (!t.dados || !R) { el.innerHTML = ''; return; }   // só nas telas de dados (swaps, carteira, novo swap)
  let h = `<div class="dados-de">Dados de <b>${fD(R.data_curva)}</b>${R.gerado_em ? ' · atualizado em ' + esc(R.gerado_em) : ''}</div>`;
  if (VELHO) h += `<div class="aviso forte" role="alert">DADOS DESATUALIZADOS: os números abaixo são de ${fD(R.data_curva)}, e já deveria haver dados de ${fD(VELHO)}. A atualização do PC não rodou ou alguma fonte falhou. Até lá, nenhum sinal é confiável: confira com o banco antes de decidir.</div>`;
  (R.avisos || []).forEach(a => { h += `<div class="aviso" role="status">${esc(a)}</div>`; });
  el.innerHTML = h;
}

// ====================================================================================================
// 5. ROTEADOR
// ====================================================================================================
async function abrir(v, urg){
  const t = TELAS.find(x => x.id === v) || TELAS[0];
  ATUAL = t.id;
  try { localStorage.setItem(CHAVE_ABA, t.id); } catch(e) {}
  fechaPaineis(); window.scrollTo(0, 0);
  document.querySelectorAll('.tela').forEach(x => x.classList.remove('on'));
  $('tela-' + (t.tipo === 'doc' ? 'doc' : t.id)).classList.add('on');
  $('titulo').textContent = t.rot; document.title = t.rot + ' · Painel de Juros';
  $('info').textContent = '';
  marcarNav(); renderFaixa(t);
  if (t.tipo === 'swap') renderSwap(t.id);
  else if (t.tipo === 'carteira') renderCarteira();
  else if (t.tipo === 'novo') renderNovo();
  else if (t.tipo === 'inflacao') renderInflacao();
  else if (t.tipo === 'roteiro') renderRoteiro();
  else if (t.tipo === 'doc') return LOCAL ? renderDocLocal(t.id) : carregarDoc(t.id, urg);
  else if (t.tipo === 'dados') { if (!LOCAL) return mostrarDados(); }
  else if (t.tipo === 'enviar') { if (!LOCAL) return mostrarEnviar(); }
  else if (t.tipo === 'diario') { if (!LOCAL) return mostrarDiario(); }
}
async function carregarDoc(v, urg){
  $('info').textContent = 'Carregando…';
  if (!cache[v]) {
    const { data, error } = await sb.from('documentos').select('titulo, html, atualizado_em').eq('slug', v).maybeSingle();
    if (ATUAL !== v) return;
    if (error) { $('info').textContent = 'Erro ao carregar: ' + error.message; return; }
    if (!data) { $('info').textContent = 'Sem acesso a este conteúdo (ou ainda não enviado pelo PC).'; $('quadro').srcdoc = ''; return; }
    cache[v] = data;
  }
  if (ATUAL !== v) return;
  $('info').textContent = `${cache[v].titulo} · enviado do PC em ${fdt(cache[v].atualizado_em)}`;
  const IR_URG = urg ? "<script>addEventListener('load',function(){setTimeout(function(){var e=document.getElementById('urg');if(e)e.scrollIntoView();},250);});<\/script>" : '';
  $('quadro').srcdoc = cache[v].html.replace('</head>', AJUSTE_CSS + '</head>').replace('</body>', AJUSTE_JS + IR_URG + '</body>');
}
function renderDocLocal(v){
  const t = TELAS.find(x => x.id === v);
  const L = (typeof window.LINKS_LOCAIS === 'object' && window.LINKS_LOCAIS) ? window.LINKS_LOCAIS : {};
  const url = typeof L[v] === 'string' && !/^\s*javascript:/i.test(L[v]) ? L[v] : '';
  $('doc-local').innerHTML = url
    ? `<div class="card"><h2>${esc(t.rot)}</h2><p class="mut">Este documento é um arquivo do PC. Ele abre numa aba nova.</p><div class="links-doc"><a class="btn prim" target="_blank" rel="noopener" href="${esc(url)}">Abrir ${esc(t.rot)}</a></div></div>`
    : '<div class="card"><p>Disponível no app do celular (precisa de login).</p></div>';
}

// ====================================================================================================
// 6. TELA DE CADA SWAP
// ====================================================================================================
function blocoSemaforo(s){
  const st = statusEf(s), mot = motivoEf(s), V = s.valor_hoje;
  let frase = '';
  if (num(V) && st !== 'bloqueado') {
    const ref = st === 'velho' ? `Estimativa de ${fD(R.data_curva)} (desatualizada): se você pedisse para encerrar` : 'Se você pedir para encerrar hoje';
    const q = Math.round(V) < 0 ? `o banco deve cobrar perto de <b data-k="valor_hoje">${fR(V)}</b>` : Math.round(V) > 0 ? `o banco deve pagar a você perto de <b data-k="valor_hoje">${fR(V)}</b>` : 'não deve haver cobrança nem pagamento (perto de <b data-k="valor_hoje">R$ 0</b>)';
    frase = `<div class="frase">${ref}${st === 'velho' ? ' naquele dia' : ''}, ${q}${num(s.erro_reais) ? `, com margem de erro de ± <span data-k="erro_reais">${fR(s.erro_reais)}</span>` : ''}.</div>`;
  }
  const ir = (st === 'sair' || st === 'cotar') ? '<button type="button" class="btn prim" data-ir-pedir>Pedir ao assessor ↓</button>' : '';
  return `<div class="sem ${st}" data-status="${st}"><div class="rot">${SEM[st].t}</div>${mot ? `<div class="mot">${esc(mot)}</div>` : ''}${frase}<div class="est">É uma estimativa. O valor que vale é a cotação que o banco informar.</div>${ir}</div>`;
}
function linhaTend(txt, reais){
  if (!num(reais)) return '';
  const r = Math.round(reais);
  return `<span>${txt}: ` + (r > 0 ? `<b class="pos">melhorou ${fR(reais)}</b>` : r < 0 ? `<b class="neg">piorou ${fR(reais)}</b>` : '<b>ficou igual</b>') + '</span>';
}
function blocoFalta(s){
  const f = s.falta_reais, meta = fMeta(s.meta);
  let titulo, extra = '';
  if (!num(f)) titulo = '<div class="medio">—</div>';
  else if (Math.round(f) > 0) titulo = `<div class="grande" data-k="falta_reais">${fR(f)}</div><div class="sub-p">é quanto falta para o valor de saída chegar à sua meta: ${esc(meta)}.</div>`;
  else titulo = `<div class="grande pos" data-k="falta_reais">${fR(f)}</div><div class="sub-p">acima da meta (${esc(meta)}): já passou dela.</div>`;
  if (num(s.falta_pp) && num(s.juros_hoje) && num(s.juros_alvo)) {
    extra = Math.round(s.falta_pp * 100) > 0
      ? `<p class="peq" style="margin-top:10px">Os juros de mercado para o prazo deste swap precisam cair <b data-k="falta_pp">${fPP(s.falta_pp)}</b>: de <span data-k="juros_hoje">${fPct(s.juros_hoje)}</span> para <span data-k="juros_alvo">${fPct(s.juros_alvo)}</span>.</p>`
      : `<p class="peq" style="margin-top:10px">Os juros de mercado para o prazo deste swap (${fPct(s.juros_hoje)}) já estão no nível da meta (${fPct(s.juros_alvo)}) ou melhor.</p>`;
  }
  const v = s.variacao || {};
  const tend = linhaTend('Em 1 semana', v.semana_reais) + linhaTend('Em 1 mês', v.mes_reais);
  const m12 = s.melhor_12m && s.melhor_12m.data
    ? `<p class="peq" style="margin:8px 0 0">${num(s.melhor_12m.falta_pp) && s.melhor_12m.falta_pp <= 0 ? `Nos últimos 12 meses, já esteve na meta em ${fD(s.melhor_12m.data)}.` : `Nos últimos 12 meses, o mais perto que chegou foi em ${fD(s.melhor_12m.data)}: faltavam ${fPP(s.melhor_12m.falta_pp)} de queda nos juros.`}</p>` : '';
  return `<div class="card"><div class="bloco-t">Quanto falta</div>${titulo}${extra}${tend ? `<div class="tend">${tend}</div>` : ''}${m12}</div>`;
}
function blocoEsperar(s){
  const e = s.esperar || {}, cm = e.custo_mes;
  let h = '';
  if (num(cm)) {
    const r = Math.round(cm);
    h += r < 0 ? `<div class="grande neg" data-k="custo_mes">${fR(cm)}</div><div class="sub-p">é o que custa cada mês parado.</div>`
       : r > 0 ? `<div class="grande pos" data-k="custo_mes">${fR(cm)}</div><div class="sub-p">é o que o contrato rende a seu favor a cada mês parado.</div>`
       : '<div class="medio">Perto de zero</div><div class="sub-p">por mês: com os juros parados, o valor de saída deste swap quase não muda.</div>';
  }
  if (num(e.falta_pp_12m)) {
    const joga = num(s.falta_pp) ? (e.falta_pp_12m > s.falta_pp + 0.004 ? 'contra' : e.falta_pp_12m < s.falta_pp - 0.004 ? 'a favor' : 'neutro') : 'neutro';
    h += `<p class="peq" style="margin-top:10px">Se os juros não se mexerem, daqui a 12 meses vão precisar cair <b data-k="falta_pp_12m">${fPP(e.falta_pp_12m)}</b>${num(s.falta_pp) ? ` (hoje: ${fPP(s.falta_pp)})` : ''}. ` +
      (joga === 'contra' ? 'O tempo joga contra: a cada mês parado a meta fica mais distante, mesmo sem os juros mudarem.' : joga === 'a favor' ? 'Nesse caso o tempo joga a seu favor: a meta fica mais perto mesmo sem os juros mudarem.' : 'Nesse caso o tempo não muda a distância até a meta.') + '</p>';
  }
  if (num(e.valor_12m_juros_parados)) h += `<p class="peq" style="margin:8px 0 0">Com os juros parados, o valor de saída daqui a 12 meses ficaria perto de ${fRs(e.valor_12m_juros_parados)}.</p>`;
  return `<div class="card"><div class="bloco-t">O que custa esperar</div>${h || '<p class="mut">Sem estimativa.</p>'}</div>`;
}
function blocoChance(s){
  const c = s.chance || {};
  const lin = (txt, f, k) => `<div class="chance"><div class="l1"><span>${txt}</span><b data-k="${k}">${faixa(f)}</b></div>${barraFaixa(f)}</div>`;
  return `<div class="card"><div class="bloco-t">Chance de chegar à meta</div>${lin('Nos próximos 12 meses', c.m12, 'chance_m12')}${lin('Até janeiro de 2030', c.jan30, 'chance_jan30')}<p class="nota" style="margin:12px 0 0">Simulação própria, com margem grande; serve para ter noção, não para prever.</p></div>`;
}
function blocoSeNao(s){
  const n = s.se_nao_chegar, vc = s.vencimento_caixa;
  let h = '';
  if (n) {
    h += `<p style="margin:0 0 6px">Chance de <b>não</b> chegar à meta até ${esc(n.quando || 'o fim do prazo')}: <b data-k="nao_chegar_prob">${faixa(n.prob)}</b>.</p>`;
    h += `<p class="peq" style="margin:0">Se isso acontecer, o valor de saída em ${esc(n.quando || 'lá')} fica perto de <b class="${cor(n.tipico)}" data-k="nao_chegar_tipico">${fRs(n.tipico)}</b>${fxTxt(n.tipico_faixa)} no resultado típico e <b class="${cor(n.ruim)}" data-k="nao_chegar_ruim">${fRs(n.ruim)}</b> num cenário ruim.</p>`;
  }
  if (vc) {
    h += `<p style="margin:12px 0 0">Se o swap for até o vencimento (${fD(vc.data)})${vc.prob ? `, o que acontece em ${faixaCurta(vc.prob)} das simulações` : ''}, você paga ou recebe a diferença em dinheiro:</p><div class="tres">` +
      [['Cenário bom', vc.bom, 'bom'], ['Cenário médio', vc.medio, 'medio'], ['Cenário ruim', vc.ruim, 'ruim']].map(([n2, v, k]) => `<div>${n2}<b class="${cor(v)}" data-k="caixa_${k}">${pagaRec(v)}</b></div>`).join('') + '</div>';
  }
  return `<div class="card"><div class="bloco-t">E se não chegar?</div>${h || '<p class="mut">Sem estimativa.</p>'}</div>`;
}
function blocoGrafico(s){
  return `<div class="card"><div class="bloco-t">Valor estimado de saída nos últimos 12 meses</div><div class="graf" data-g="${s.id}"></div><div class="leg"><span>Linha azul: valor estimado</span><span>Tracejada: sua meta, ${esc(fMeta(s.meta))}</span></div></div>`;
}
function blocoContrato(s){
  const c = s.contrato || {};
  return `<details><summary>Dados do contrato</summary><dl>
    <dt>Valor do contrato</dt><dd>${num(c.valor) ? fR(c.valor) : '—'}</dd>
    <dt>O que você recebe</dt><dd>taxa fixa de ${fPct(c.recebe_pre)} ao ano</dd>
    <dt>O que você paga</dt><dd>${num(c.paga_pct_cdi) ? c.paga_pct_cdi.toLocaleString('pt-BR') + '% do CDI' : '—'}</dd>
    <dt>Início</dt><dd>${fD(c.inicio)}</dd>
    <dt>Vencimento</dt><dd>${fD(c.vencimento)}</dd></dl></details>`;
}

// ---- pedido ao assessor (uma mensagem por swap)
const TIPOS_PEDIDO = [
  {v:'cot',  t:'Pedir a cotação de saída (não executa nada)', d: () => 'O banco só informa o preço de saída. Nada é encerrado.'},
  {v:'cond', t:'Encerrar só se o valor for igual ou melhor que a minha meta', d: s => `O banco só executa se o valor de saída for igual ou melhor que a sua meta (${fMeta(s.meta)}).`},
  {v:'merc', t:'Encerrar hoje, a mercado, sem valor mínimo', d: () => 'O banco executa na hora, pelo preço do dia, seja ele qual for.'},
];
const descSwap = s => {
  const c = s.contrato || {};
  return `Swap com vencimento em ${fD(c.vencimento)}, no valor de ${num(c.valor) ? fR2(c.valor) : '—'}, em que recebo taxa fixa de ${fPct(c.recebe_pre)} ao ano e pago ${num(c.paga_pct_cdi) ? c.paga_pct_cdi.toLocaleString('pt-BR') : '—'}% do CDI` + (c.inicio ? ` (contratado em ${fD(c.inicio)}).` : '.');
};
const nomeAssessor = () => (R && R.assessor && R.assessor.nome) || 'Prezado';
function msgPedido(s, tipo){
  const a = nomeAssessor() + ', ' + saud() + '.\n\n', fim = '\n\nObrigado,\nAnderson';
  if (tipo === 'merc') {
    return a + `Peço o ENCERRAMENTO IMEDIATO do swap abaixo na minha conta:\n- ${descSwap(s)}\n  Referência no meu acompanhamento: ${fRs(s.valor_hoje)} (estimativa de ${fD(R.data_curva)}).\n\nOs valores acima são estimativas minhas, só para referência. Por favor, executem hoje, a mercado, e me confirmem por escrito o valor efetivo de liquidação.\n\nEsta é uma ordem expressa de encerramento.` + fim;
  }
  if (tipo === 'cond') {
    return a + `Peço a COTAÇÃO FIRME de saída e o ENCERRAMENTO do swap abaixo, condicionado ao valor mínimo:\n- ${descSwap(s)}\n  Encerrar somente se o valor de liquidação for igual ou melhor que ${fMin(s.meta)}.\n\nSe a cotação de hoje atingir esse valor, executem hoje e me confirmem por escrito o valor efetivo de liquidação. Se não atingir, por favor NÃO executem e me informem por escrito a cotação firme de saída.` + fim;
  }
  return a + `Peço a cotação firme de saída, hoje, do swap abaixo:\n- ${descSwap(s)}\n\nÉ só um pedido de cotação: por favor, não executem nada. Me informem por escrito o valor de liquidação (e se é a meu favor ou contra mim) e até que horas essa cotação vale.` + fim;
}
const assuntoPedido = tipo => (tipo === 'merc' ? 'ORDEM: encerramento imediato de swap' : tipo === 'cond' ? 'ORDEM CONDICIONADA: cotação e encerramento de swap' : 'Pedido de cotação de saída de swap') + ' — Anderson';
function linksContato(assunto, corpo){
  const A = (R && R.assessor) || {};
  const mail = 'mailto:' + (A.email || '') + '?' + (A.cc ? 'cc=' + encodeURIComponent(A.cc) + '&' : '') + 'subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(corpo);
  const wa = (A.whatsapp ? 'https://wa.me/' + String(A.whatsapp).replace(/\D/g, '') : 'https://wa.me/') + '?text=' + encodeURIComponent(corpo);
  return {mail, wa};
}
async function copiarTexto(ta, btn){
  const txt = ta.value, ant = btn.textContent;
  try { await navigator.clipboard.writeText(txt); }
  catch (e) { ta.removeAttribute('readonly'); ta.select(); ta.setSelectionRange(0, 99999); try { document.execCommand('copy'); } catch (e2) {} ta.setAttribute('readonly', ''); }
  btn.textContent = 'Copiado'; setTimeout(() => { btn.textContent = ant; }, 1800);
}
function blocoPedido(s){
  return `<div class="card" id="pedir-${s.id}"><div class="bloco-t">Pedir ao assessor</div>
    <p class="peq">Escolha o tipo de pedido. O app só monta a mensagem e abre o rascunho: quem envia é você.</p>
    <div class="tipos" role="radiogroup" aria-label="Tipo de pedido">${TIPOS_PEDIDO.map((p, i) => `<label class="tipo${i === 0 ? ' on' : ''}"><input type="radio" name="tp-${s.id}" value="${p.v}"${i === 0 ? ' checked' : ''}><span><b>${p.t}</b><small>${esc(p.d(s))}</small></span></label>`).join('')}</div>
    <div class="alerta hidden" data-alerta role="alert"></div>
    <label for="msg-${s.id}">Mensagem</label>
    <textarea id="msg-${s.id}" class="msgbox" readonly rows="9"></textarea>
    <div class="acoes"><a class="btn prim" data-mail target="_blank" rel="noopener" href="#">Abrir e-mail</a><a class="btn" data-wa target="_blank" rel="noopener" href="#">Abrir WhatsApp</a><button type="button" class="btn" data-copiar>Copiar mensagem</button><button type="button" class="btn precisa-login" data-anotar>Anotar no diário</button></div>
    <p class="nota" style="margin:0">Os botões só abrem o rascunho. Nada é enviado sem você apertar “enviar”. Depois de enviar, use “Anotar no diário” para guardar o registro.</p></div>`;
}
function ligarPedido(sec, s){
  const card = sec.querySelector('#pedir-' + s.id); if (!card) return;
  const ta = card.querySelector('textarea');
  const atualizar = () => {
    const tipo = (card.querySelector('input[type=radio]:checked') || {}).value || 'cot';
    card.querySelectorAll('.tipo').forEach(l => l.classList.toggle('on', l.querySelector('input').checked));
    const m = msgPedido(s, tipo), L = linksContato(assuntoPedido(tipo), m);
    ta.value = m;
    card.querySelector('[data-mail]').href = L.mail; card.querySelector('[data-wa]').href = L.wa;
    const al = card.querySelector('[data-alerta]');
    if (tipo === 'merc') {
      al.innerHTML = `<b>Atenção:</b> sem valor mínimo, o banco executa pelo preço do dia. Pela estimativa de ${fD(R.data_curva)}, isso significa realizar perto de <b data-k="alerta_valor">${fRs(s.valor_hoje)}</b>` + (num(s.erro_reais) ? ` (margem de erro de ± ${fR(s.erro_reais)}; o valor do banco pode ser pior).` : '; o valor do banco pode ser pior.');
      al.classList.remove('hidden');
    } else if (tipo === 'cond' && VELHO) {
      al.innerHTML = 'Os dados do app estão desatualizados. Este pedido continua seguro, porque quem decide é a cotação do banco.'; al.classList.remove('hidden');
    } else al.classList.add('hidden');
  };
  card.querySelectorAll('input[type=radio]').forEach(r => r.addEventListener('change', atualizar));
  card.querySelector('[data-copiar]').onclick = e => copiarTexto(ta, e.currentTarget);
  const an = card.querySelector('[data-anotar]');
  if (an) an.onclick = () => {
    const tipo = (card.querySelector('input[type=radio]:checked') || {}).value || 'cot';
    PRE_DIARIO = {swap: s.id, tipo: {cot:'cotacao', cond:'ordem_condicionada', merc:'ordem_mercado'}[tipo] || 'outro', texto: ta.value};
    abrir('diario');
  };
  atualizar();
}
function renderSwap(id){
  const sec = $('tela-' + id), s = swapPorId(id);
  if (!R) { sec.innerHTML = vazioResumo(); return; }
  if (!s) { sec.innerHTML = '<div class="card"><p>Este swap não está no resumo enviado.</p></div>'; return; }
  sec.innerHTML = blocoSemaforo(s) + `<div class="grade">${blocoFalta(s)}${blocoEsperar(s)}</div><div class="grade">${blocoChance(s)}${blocoSeNao(s)}</div>` +
    (s.serie && s.serie.length > 1 ? blocoGrafico(s) : '') + blocoPedido(s) + blocoContrato(s);
  const g = sec.querySelector('.graf'); if (g) g._g = {serie:s.serie, meta:s.meta};
  const ir = sec.querySelector('[data-ir-pedir]'); if (ir) ir.onclick = () => sec.querySelector('#pedir-' + s.id).scrollIntoView({behavior:'smooth', block:'start'});
  ligarPedido(sec, s);
  redesenharGraficos();
}

// ====================================================================================================
// 7. GRÁFICO PRÓPRIO (SVG, sem biblioteca)
// ====================================================================================================
function passoBonito(x){ const e = Math.pow(10, Math.floor(Math.log10(x))), f = x / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; }
const fCurto = v => { if (Math.round(v) === 0) return 'R$ 0'; const a = Math.abs(v), s = v < 0 ? '−' : ''; return a >= 1000 ? s + 'R$ ' + (a / 1000).toLocaleString('pt-BR', {maximumFractionDigits:1}) + ' mil' : s + 'R$ ' + Math.round(a); };
function desenharGrafico(el){
  const g = el._g; if (!g || !g.serie || g.serie.length < 2) return;
  const W = Math.floor(el.clientWidth); if (W < 60) return;
  const n = g.serie.length, H = W < 520 ? 210 : 250, pl = 62, pr = 12, pt = 10, pb = 26;
  const vals = g.serie.map(p => p[1]); let lo = Math.min(...vals), hi = Math.max(...vals);
  if (num(g.meta)) { lo = Math.min(lo, g.meta); hi = Math.max(hi, g.meta); }
  if (hi === lo) { hi += 1; lo -= 1; }
  const pad = (hi - lo) * .08; lo -= pad; hi += pad;
  const X = i => pl + (W - pl - pr) * i / (n - 1), Y = v => pt + (H - pt - pb) * (hi - v) / (hi - lo);
  const passo = passoBonito((hi - lo) / 4), ticks = [];
  for (let v = Math.ceil(lo / passo) * passo; v <= hi; v += passo) ticks.push(Math.abs(v) < passo / 1e6 ? 0 : v);
  const linha = g.serie.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
  const xs = [0, Math.round((n - 1) / 2), n - 1];
  const ult = g.serie[n - 1];
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Valor estimado de saída nos últimos 12 meses. Hoje: ${fRs(ult[1])}.">
    ${ticks.map(v => `<line x1="${pl}" x2="${W - pr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="var(--grid)" stroke-width="1"/><text x="${pl - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="var(--fg2)">${fCurto(v)}</text>`).join('')}
    ${xs.map((i, k) => `<text x="${X(i).toFixed(1)}" y="${H - 7}" text-anchor="${k === 0 ? 'start' : k === 2 ? 'end' : 'middle'}" font-size="11" fill="var(--fg2)">${fMA(g.serie[i][0])}</text>`).join('')}
    ${num(g.meta) ? `<line x1="${pl}" x2="${W - pr}" y1="${Y(g.meta).toFixed(1)}" y2="${Y(g.meta).toFixed(1)}" stroke="var(--vd)" stroke-width="2" stroke-dasharray="6 4"/><text x="${W - pr}" y="${(Y(g.meta) - 5).toFixed(1)}" text-anchor="end" font-size="11" font-weight="700" fill="var(--vd)">meta</text>` : ''}
    <path d="${linha}" fill="none" stroke="var(--s1)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${X(n - 1).toFixed(1)}" cy="${Y(ult[1]).toFixed(1)}" r="4" fill="var(--s1)"/>
    <g class="cruz" style="display:none"><line y1="${pt}" y2="${H - pb}" stroke="var(--fg3)" stroke-width="1"/><circle r="4.5" fill="var(--bg)" stroke="var(--s1)" stroke-width="2"/></g>
    <rect x="${pl}" y="${pt}" width="${W - pl - pr}" height="${H - pt - pb}" fill="transparent"/></svg><div class="gtip">Hoje (${fD(ult[0])}): <b>${fRs(ult[1])}</b>. Toque no gráfico para ver outra data.</div>`;
  const sv = el.querySelector('svg'), cruz = sv.querySelector('.cruz'), tip = el.querySelector('.gtip');
  const mover = ev => {
    const r = sv.getBoundingClientRect(), x = (ev.clientX - r.left) * (W / r.width);
    const i = Math.max(0, Math.min(n - 1, Math.round((x - pl) / (W - pl - pr) * (n - 1))));
    cruz.style.display = ''; cruz.querySelector('line').setAttribute('x1', X(i)); cruz.querySelector('line').setAttribute('x2', X(i));
    const c = cruz.querySelector('circle'); c.setAttribute('cx', X(i)); c.setAttribute('cy', Y(g.serie[i][1]));
    tip.innerHTML = `${fD(g.serie[i][0])}: <b>${fRs(g.serie[i][1])}</b>`;
  };
  sv.addEventListener('pointermove', mover); sv.addEventListener('pointerdown', mover);
}
function redesenharGraficos(){
  document.querySelectorAll('.tela.on .graf').forEach(desenharGrafico);
}
let _rz = null;
window.addEventListener('resize', () => { clearTimeout(_rz); _rz = setTimeout(redesenharGraficos, 120); });

// ====================================================================================================
// 8. CARTEIRA
// ====================================================================================================
function renderCarteira(){
  const sec = $('tela-carteira'), C = R && R.carteira;
  if (!R) { sec.innerHTML = vazioResumo(); return; }
  if (!C) { sec.innerHTML = '<div class="card"><p>A carteira não está no resumo enviado.</p></div>'; return; }
  const sit = String(C.situacao || '').toLowerCase();
  const tipo = sit.indexOf('luc') === 0 ? 'luc' : sit.indexOf('prej') === 0 ? 'prej' : (num(C.valor_hoje) ? (C.valor_hoje < 0 ? 'prej' : C.valor_hoje > 0 ? 'luc' : 'zero') : 'zero');
  const rot = tipo === 'luc' ? 'LUCRO de' : tipo === 'prej' ? 'PREJUÍZO de' : 'RESULTADO de';
  const ordem = ['s30a', 's35', 's30b'].map(swapPorId).filter(Boolean);
  const metas = (R.swaps || []).map(s => s.meta), metaTot = metas.every(num) ? metas.reduce((a, b) => a + b, 0) : null;
  const todosZero = metas.length && metas.every(m => m === 0);
  let h = `<div class="hero ${tipo}"><span class="rot">${rot}</span><b class="valor" data-k="carteira_valor_hoje">${fR(C.valor_hoje)}</b><div class="sub-p">é o que a carteira toda valeria se os três swaps fossem encerrados hoje (estimativa)${num(C.erro_reais) ? `, com margem de erro de ± <span data-k="carteira_erro">${fR(C.erro_reais)}</span>` : ''}. O valor que vale é a cotação que o banco informar.</div></div>`;
  h += '<div class="bloco-t">Cada swap</div>' + ordem.map(s => {
    const st = statusEf(s);
    return `<button type="button" class="linha-sw" data-ir="${s.id}"><span class="n">${esc(s.rotulo)}</span><span class="v ${cor(s.valor_hoje)}" data-k="${s.id}_valor_hoje">${fRs(s.valor_hoje)}</span><span class="m">Meta: ${esc(fMeta(s.meta))}</span><span class="chip ${st}">${SEM[st].c}</span></button>`;
  }).join('');
  h += '<div class="grade" style="margin-top:12px">';
  if (num(C.custo_mes)) h += `<div class="card"><div class="bloco-t">O que custa esperar, somando os três</div><div class="medio ${cor(C.custo_mes)}" data-k="carteira_custo_mes">${fR(C.custo_mes)} por mês</div><p class="peq" style="margin-top:6px">${Math.round(C.custo_mes) < 0 ? 'É quanto a carteira perde a cada mês parada, se os juros não se mexerem.' : 'É quanto a carteira ganha a cada mês parada, se os juros não se mexerem.'}</p></div>`;
  if (C.custo_entrada_estimado) h += `<div class="card"><div class="bloco-t">Custo de entrada (estimado)</div><div class="medio" data-k="carteira_entrada">${fR(C.custo_entrada_estimado.min)} a ${fR(C.custo_entrada_estimado.max)}</div><p class="peq" style="margin-top:6px">É uma estimativa do que o banco ganhou, embutido no preço, quando os swaps foram contratados.</p></div>`;
  h += '</div>';
  h += `<div class="card"><div class="bloco-t">Chance de chegar à meta</div>
    <div class="chance"><div class="l1"><span>Chance de os três chegarem ${todosZero ? 'a zero (sem perda)' : 'à meta'}</span><b data-k="chance_todos_zero">${faixa(C.chance_todos_zero)}</b></div>${barraFaixa(C.chance_todos_zero)}</div>
    <div class="chance"><div class="l1"><span>Chance de nenhum chegar</span><b data-k="chance_nenhum">${faixa(C.chance_nenhum)}</b></div>${barraFaixa(C.chance_nenhum)}</div>`;
  if (C.se_nenhum_chegar) h += `<p class="peq" style="margin:12px 0 0">Se nenhum chegar, o valor da carteira em ${esc(C.se_nenhum_chegar.quando || 'lá')} fica perto de <b class="${cor(C.se_nenhum_chegar.tipico)}">${fRs(C.se_nenhum_chegar.tipico)}</b>${fxTxt(C.se_nenhum_chegar.tipico_faixa)} no resultado típico e <b class="${cor(C.se_nenhum_chegar.ruim)}">${fRs(C.se_nenhum_chegar.ruim)}</b> num cenário ruim.</p>`;
  h += '<p class="nota" style="margin:10px 0 0">Simulação própria, com margem grande; serve para ter noção, não para prever.</p></div>';
  if (C.caixa_2030) h += `<div class="card"><div class="bloco-t">Os swaps de 2030 até o vencimento</div><p style="margin:0">Se os dois forem até o vencimento (${fD(C.caixa_2030.data)})${C.caixa_2030.prob ? `, o que acontece em ${faixaCurta(C.caixa_2030.prob)} das simulações` : ''}, você paga ou recebe a diferença em dinheiro. É o dinheiro que precisa estar disponível nessa data:</p><div class="tres">${[['Cenário bom', C.caixa_2030.bom, 'bom'], ['Cenário médio', C.caixa_2030.medio, 'medio'], ['Cenário ruim', C.caixa_2030.ruim, 'ruim']].map(([n2, v, k]) => `<div>${n2}<b class="${cor(v)}" data-k="carteira_caixa_${k}">${pagaRec(v)}</b></div>`).join('')}</div></div>`;
  if (C.serie && C.serie.length > 1) h += `<div class="card"><div class="bloco-t">Valor estimado da carteira nos últimos 12 meses</div><div class="graf" data-g="carteira"></div><div class="leg"><span>Linha azul: total dos três swaps</span>${metaTot == null ? '' : `<span>Tracejada: soma das metas, ${esc(fMeta(metaTot))}</span>`}</div></div>`;
  sec.innerHTML = h;
  const g = sec.querySelector('.graf'); if (g) g._g = {serie:C.serie, meta:metaTot};
  sec.querySelectorAll('[data-ir]').forEach(b => b.onclick = () => abrir(b.dataset.ir));
  redesenharGraficos();
}

// ====================================================================================================
// 9. NOVO SWAP
// ====================================================================================================
// ---- conta do dia da entrada (igual à do PC): quanto vale, no primeiro dia, um swap novo de 'valor' à taxa 'taxa'
function custoEntrada(N, valor, taxa){
  const c = N.calc; if (!c || !num(c.r) || !num(c.n)) return null;
  const d = Math.pow(1 + c.r / 100, 1 / 252) - 1;
  return valor * (Math.pow(1 + taxa / 100, c.n / 252) - Math.pow(1 + c.pct * d, c.n)) / Math.pow(1 + c.r / 100, c.n / 252);
}
// ---- interpolação na grade valor × taxa da simulação
function naGrade(N, valor, taxa){
  const G = N.grade; if (!G || !G.celulas) return null;
  const V = G.valores, T = G.taxas, nt = T.length;
  const pos = (arr, x) => { x = Math.min(Math.max(x, arr[0]), arr[arr.length - 1]); let i = 0; while (i < arr.length - 2 && x > arr[i + 1]) i++; return [i, (x - arr[i]) / (arr[i + 1] - arr[i])]; };
  const [iv, fv] = pos(V, valor), [it, ft] = pos(T, taxa);
  const cel = (a, b) => G.celulas[a * nt + b];
  const out = {};
  G.colunas.forEach((k, j) => { out[k] = cel(iv, it)[j] * (1 - fv) * (1 - ft) + cel(iv + 1, it)[j] * fv * (1 - ft) + cel(iv, it + 1)[j] * (1 - fv) * ft + cel(iv + 1, it + 1)[j] * fv * ft; });
  const mil = v => Math.round(v / 1000) * 1000;
  return {chance: {min: out.chance_min, max: out.chance_max}, tipico: mil(out.tipico), tipico_faixa: {min: mil(out.tipico_min), max: mil(out.tipico_max)},
          pior_caso: mil(out.pior_caso), pior_hoje: {min: out.pior_hoje_min, max: out.pior_hoje_max}, c2030: {min: out.c2030_min, max: out.c2030_max},
          cen: G.tem_cenarios ? {otimista: mil(out.cen_otimista), base: mil(out.cen_base), premio: mil(out.cen_premio), estresse: mil(out.cen_estresse)} : null,
          fora: valor < V[0] || valor > V[V.length - 1] || taxa < T[0] || taxa > T[T.length - 1]};
}
const CHAVE_OFERTA = 'ofertaAssessorV1';
function ofertaSalva(N){
  const srv = N.oferta_assessor && num(N.oferta_assessor.taxa) ? N.oferta_assessor : null;
  let loc = null;
  try { const o = JSON.parse(localStorage.getItem(CHAVE_OFERTA) || 'null'); if (o && num(o.valor) && num(o.taxa)) loc = o; } catch (e) {}
  if (loc && srv) return String(loc.data || '') > String(srv.data || '') ? loc : srv;     // a mais recente
  return loc || srv;
}
// ---- registro da proposta oficial: a 1ª linha do texto é lida pelo PC; o resto é para você ler no diário
function linhaProposta(o){
  const n = (k, v, casas) => num(v) ? '|' + k + '=' + v.toFixed(casas) : '';
  return 'PROPOSTA' + n('valor', o.valor, 2) + n('taxa', o.taxa, 4) + n('cdi', o.cdi, 2) + (o.venc ? '|venc=' + o.venc : '') + (o.data ? '|data=' + o.data : '') +
    n('justa', o.justa, 4) + n('saida', o.saida, 2) + n('rem', o.rem, 2);
}
function textoProposta(o){
  let t = `Proposta de novo swap recebida do banco: ${fR(o.valor)} a ${fTaxa(o.taxa)} ao ano, pagando ${o.cdi.toLocaleString('pt-BR')}% do CDI, vencimento ${fD(o.venc)}. Data da proposta: ${fD(o.data)}.`;
  if (num(o.justa)) t += ` Taxa justa de mercado informada pelo banco: ${fTaxa(o.justa)} ao ano.`;
  if (num(o.saida)) t += ` Valor de saída no dia da contratação informado pelo banco: ${fRs(o.saida)}.`;
  if (num(o.rem)) t += ` Remuneração do banco e do escritório informada: ${fR(o.rem)}.`;
  if (o.obs) t += ' Observação: ' + o.obs;
  return t;
}
const fTaxa = t => t.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}) + '%';
function renderNovo(){
  const sec = $('tela-novo'), N = R && R.novo_swap;
  if (!R) { sec.innerHTML = vazioResumo(); return; }
  if (!N) { sec.innerHTML = '<div class="card"><h2>Novo swap</h2><p class="mut">O resumo enviado não traz a avaliação de um novo swap.</p></div>'; return; }
  const G = N.grade, of = ofertaSalva(N), vPad = (of && num(of.valor)) ? of.valor : 100000;
  const vMin = G ? G.valores[0] : 50000, vMax = G ? G.valores[G.valores.length - 1] : 500000, tMin = G ? G.taxas[0] : 15, tMax = G ? G.taxas[G.taxas.length - 1] : 23;
  const cond = `pagando ${num(N.pct_cdi) ? N.pct_cdi.toLocaleString('pt-BR') : '135'}% do CDI, com vencimento em ${fD(N.vencimento)}`;
  sec.innerHTML = `
  <div class="card"><div class="bloco-t">O que é esta tela</div>
    <p style="margin:0">Um novo swap é <b>mais uma aposta na queda dos juros</b>. Se os juros caírem, ele ajuda a compensar a perda dos swaps que você já tem. Se não caírem, ele <b>aumenta</b> a perda. Aqui você vê, em reais, o que muda com e sem ele.</p></div>
  <div class="card"><div class="bloco-t">Taxa justa de mercado hoje</div><div class="grande" data-k="taxa_justa">${fPct(N.taxa_justa)} ao ano</div>
    <p class="peq" style="margin-top:6px">É a taxa fixa que tornaria justo, para os dois lados, um swap ${cond}${N.data_taxa ? ` (taxa de ${fD(N.data_taxa)})` : ''}. <b>Abaixo dela você já entra perdendo</b>; a diferença fica com o banco.</p></div>
  <div class="card" id="sim-novo"><div class="bloco-t">Simulação</div>
    <p class="peq" style="margin:0">Escolha o ponto de partida. O padrão são as condições de mercado de hoje.</p>
    <div class="presets" role="group" aria-label="Ponto de partida">
      <button type="button" data-pre="mercado"><span>Mercado hoje</span><small>${fTaxa(N.taxa_justa)}</small></button>
      ${of ? `<button type="button" data-pre="oferta"><span>Última oferta do assessor</span><small>${fTaxa(of.taxa)}${num(of.valor) ? ' · ' + fR(of.valor) : ''}</small></button>` : ''}
      <button type="button" data-pre="livre"><span>Personalizada</span><small>você ajusta</small></button>
    </div>
    <div class="ctrl"><div class="lbl"><label for="nsValor" style="margin:0">Valor do novo swap</label><b id="nsValorTxt"></b></div>
      <input id="nsValor" type="range" min="${vMin}" max="${vMax}" step="10000" aria-describedby="nsValorTxt"></div>
    <div class="ctrl"><div class="lbl"><label for="nsTaxa" style="margin:0">Taxa fixa que você receberia</label><b id="nsTaxaTxt"></b></div>
      <input id="nsTaxa" type="range" min="${tMin}" max="${tMax}" step="0.05" aria-describedby="nsTaxaTxt"></div>
    <p class="nota" style="margin:8px 0 0">Condições fixas: ${cond}.</p>
    <div id="nsRes"></div>
  </div>
  <div class="card"><div class="bloco-t">1. Pedir a proposta ao assessor</div>
    <p class="peq" style="margin:0 0 8px">A mensagem já vai com os campos para o assessor preencher. São exatamente os números que o app precisa. O app só monta a mensagem; quem envia é você.</p>
    <textarea id="nsMsg" class="msgbox" readonly rows="10"></textarea>
    <div class="acoes"><a class="btn prim" id="nsMail" target="_blank" rel="noopener" href="#">Abrir e-mail</a><a class="btn" id="nsWa" target="_blank" rel="noopener" href="#">Abrir WhatsApp</a><button type="button" class="btn" id="nsCopiar">Copiar mensagem</button><button type="button" class="btn precisa-login" id="nsAnotar">Anotar no diário</button></div></div>
  <div class="card precisa-login"><div class="bloco-t">2. Registrar a resposta do banco</div>
    <p class="peq" style="margin:0 0 4px">Quando a resposta chegar por e-mail ou WhatsApp, copie os números para cá. Ela fica guardada no diário, vira a “Última oferta do assessor” e o app passa a comparar os números do banco com a conta própria. Deixe em branco o que o banco não informou.</p>
    <div class="lin"><label for="pValor">1. Valor da operação (R$)</label><input id="pValor" inputmode="decimal" placeholder="ex.: 100.000"></div>
    <div class="lin"><label for="pTaxa">2. Taxa fixa que você receberia (% ao ano)</label><input id="pTaxa" inputmode="decimal" placeholder="ex.: 19,00"></div>
    <div class="lin"><label for="pCdi">3. Percentual do CDI que você pagaria (%)</label><input id="pCdi" inputmode="decimal" placeholder="ex.: 135"></div>
    <label for="pVenc">4. Vencimento</label><input id="pVenc" type="date">
    <label for="pData">5. Data da proposta</label><input id="pData" type="date">
    <div class="lin"><label for="pJusta">6. Taxa justa de mercado no dia, segundo o banco (% ao ano)</label><input id="pJusta" inputmode="decimal" placeholder="opcional"></div>
    <div class="lin"><label for="pSaida">7. Valor de saída no dia da contratação, segundo o banco (R$; use o sinal de menos se for contra você)</label><input id="pSaida" inputmode="decimal" placeholder="opcional"></div>
    <div class="lin"><label for="pRem">8. Remuneração do banco e do escritório (R$)</label><input id="pRem" inputmode="decimal" placeholder="opcional"></div>
    <label for="pObs">Observação (opcional)</label><textarea id="pObs" rows="2" maxlength="600"></textarea>
    <button class="pri" id="pBtn" type="button">Registrar a proposta</button>
    <div class="msg" id="pMsg"></div></div>
  <div class="card so-celular"><p style="margin:0">Para registrar a resposta do banco, use o app do celular (precisa de login).</p></div>
  <div id="nsOficial"></div>
  <p class="nota">Simulação própria${N.simulacao_de ? ' de ' + fD(N.simulacao_de) : ''}, com margem grande; serve para ter noção, não para prever. “A soma chegar a zero” = sair de todos os swaps juntos, com um compensando o outro; é diferente de cada swap chegar a zero sozinho (aba Carteira).</p>
  <div class="destaque-fixo">O app mostra os números; a decisão é sua. Não é recomendação de investimento.</div>`;

  const elV = $('nsValor'), elT = $('nsTaxa'), S0 = N.sem_novo, EST = {valor: vPad, taxa: N.taxa_justa};
  const marcar = modo => sec.querySelectorAll('.presets button').forEach(b => b.classList.toggle('on', b.dataset.pre === modo));
  const atualizar = () => {
    const valor = EST.valor, taxa = EST.taxa;
    $('nsValorTxt').textContent = fR(valor); $('nsTaxaTxt').textContent = fTaxa(taxa) + ' ao ano';
    const ce = custoEntrada(N, valor, taxa), g = naGrade(N, valor, taxa), dif = num(N.taxa_justa) ? N.taxa_justa - taxa : null;
    let h = '';
    if (num(ce)) {
      const r = Math.round(ce), tol = Math.max(50, 0.015 * valor);
      h += `<div class="entrada ${r < -tol ? 'neg' : r > tol ? 'pos' : ''}"><div class="bloco-t" style="margin:0 0 2px">No dia da entrada</div>` +
        (r < -tol ? `<div class="medio neg" data-k="ns_entrada">Você entra perdendo ${fR(ce)}</div><p class="peq" style="margin:4px 0 0">A taxa está ${fPP(dif)} abaixo da justa. Essa diferença, em reais, é o que fica com o banco logo na contratação.</p>`
         : r > tol ? `<div class="medio pos" data-k="ns_entrada">Você entra ganhando ${fR(ce)}</div><p class="peq" style="margin:4px 0 0">A taxa está acima da justa de mercado. É raro o banco oferecer isso; confira os termos por escrito.</p>`
         : `<div class="medio" data-k="ns_entrada">Você entra no zero a zero</div><p class="peq" style="margin:4px 0 0">A taxa é praticamente a justa de mercado (diferença de ${fR(ce)} no primeiro dia).</p>`) + '</div>';
    }
    if (g && S0) {
      const lin = (rot, a, b, cls) => `<div>${rot}</div><div>${a}</div><div class="${cls || ''}">${b}</div>`;
      h += `<div class="duas"><div>Até jan/2030</div><div>Sem o novo</div><div>Com o novo</div>` +
        lin('Chance de a soma de todos chegar a zero', faixaCurta(S0.chance_zerar_carteira), `<span data-k="ns_chance">${faixaCurta(g.chance)}</span>`) +
        lin('Resultado típico, sem encerrar nada', fRs(S0.tipico), `<span data-k="ns_tipico">${fRs(g.tipico)}</span>`, cor(g.tipico)) +
        lin('Cenário ruim (1 em cada 10)', fRs(S0.pior_caso), `<span data-k="ns_pior">${fRs(g.pior_caso)}</span>`, 'neg') +
        lin('Chance de terminar pior que hoje', faixaCurta(S0.prob_pior_que_hoje), faixaCurta(g.pior_hoje)) + '</div>';
      const dCh = Math.round(((g.chance.min + g.chance.max) - (S0.chance_zerar_carteira.min + S0.chance_zerar_carteira.max)) * 50), dP = g.pior_caso - S0.pior_caso;
      h += `<p style="margin:10px 0 0"><b>Em poucas palavras:</b> a chance de a soma chegar a zero ${dCh > 0 ? 'sobe cerca de ' + dCh + ' ponto' + (dCh > 1 ? 's' : '') + ' percentua' + (dCh > 1 ? 'is' : 'l') : dCh < 0 ? 'cai cerca de ' + (-dCh) + ' ponto' + (dCh < -1 ? 's' : '') + ' percentua' + (dCh < -1 ? 'is' : 'l') : 'quase não muda'}, e o cenário ruim ${Math.round(dP) < 0 ? 'piora em ' + fR(dP) : Math.round(dP) > 0 ? 'melhora em ' + fR(dP) : 'não muda'}.</p>` +
        `<p class="peq" style="margin:6px 0 0">Chance de este novo swap compensar sozinho a perda do 2030 maior: ${faixaCurta(g.c2030)}.</p>` +
        ((g.cen && S0.por_cenario && N.cenarios) ? `<div class="bloco-t" style="margin:14px 0 0">E se… resultado típico em jan/2030, em cada cenário de juros</div><div class="duas"><div>Cenário</div><div>Sem o novo</div><div>Com o novo</div>` +
          N.cenarios.map(cn => `<div><b>${esc(cn.nome)}</b><br><small class="peq">${esc(cn.explica)}</small></div><div class="${cor(S0.por_cenario[cn.id])}">${fRs(S0.por_cenario[cn.id])}</div><div class="${cor(g.cen[cn.id])}" data-k="ns_cen_${cn.id}">${fRs(g.cen[cn.id])}</div>`).join('') +
          `</div><p class="peq" style="margin:6px 0 0">O novo swap ajuda quando os juros caem e piora o resultado quando a inflação e os juros sobem. A tela “Inflação e juros” mostra para onde a inflação está indo.</p>` : '') +
        `<p class="peq" style="margin:6px 0 0">O resultado típico varia muito conforme a hipótese: sem o novo, de ${fRs(S0.tipico_faixa.min)} a ${fRs(S0.tipico_faixa.max)}; com o novo, de ${fRs(g.tipico_faixa.min)} a ${fRs(g.tipico_faixa.max)}.</p>`;
    } else h += '<p class="mut" style="margin-top:10px">As chances não estão disponíveis neste resumo; só a conta do dia da entrada.</p>';
    $('nsRes').innerHTML = h;
    const m = `${nomeAssessor()}, ${saud()}.\n\nSobre a proposta de um novo swap: antes de qualquer decisão, peço que me respondam por escrito preenchendo os campos abaixo.\n\n1. Valor da operação: R$ ______\n2. Taxa fixa que eu receberia: ______% ao ano\n3. Percentual do CDI que eu pagaria: ______%\n4. Vencimento: __/__/____\n5. Data desta proposta e até quando ela vale: __/__/____ (válida até __/__/____)\n6. Taxa justa de mercado, no dia, para essas mesmas condições: ______% ao ano\n7. Valor de saída da operação no próprio dia da contratação: R$ ______ (a meu favor ou contra mim)\n8. Remuneração do banco e do escritório nessa operação: R$ ______\n\nPara referência, estou avaliando ${fR(valor)} a ${fTaxa(taxa)} ao ano, ${cond}. Pelo meu acompanhamento, a taxa justa de mercado para essas condições está perto de ${fTaxa(N.taxa_justa)} ao ano.\n\nNão é uma ordem de contratação.\n\nObrigado,\nAnderson`;
    $('nsMsg').value = m; const L = linksContato('Proposta de novo swap: pedido de informações — Anderson', m); $('nsMail').href = L.mail; $('nsWa').href = L.wa;
  };
  const aplicar = modo => {
    const lim = (x, a, b) => Math.min(Math.max(x, a), b);
    if (modo === 'oferta' && of) { EST.valor = lim(of.valor || vPad, vMin, vMax); EST.taxa = lim(of.taxa, tMin, tMax); }
    else if (modo === 'mercado') { EST.valor = lim(vPad, vMin, vMax); EST.taxa = lim(N.taxa_justa, tMin, tMax); }
    elV.value = EST.valor; elT.value = EST.taxa;
    marcar(modo); atualizar();
  };
  sec.querySelectorAll('.presets button').forEach(b => b.onclick = () => aplicar(b.dataset.pre));
  elV.addEventListener('input', () => { EST.valor = +elV.value; marcar('livre'); atualizar(); });
  elT.addEventListener('input', () => { EST.taxa = +elT.value; marcar('livre'); atualizar(); });
  $('nsCopiar').onclick = e => copiarTexto($('nsMsg'), e.currentTarget);
  $('nsAnotar').onclick = () => { PRE_DIARIO = {swap:'novo', tipo:'pergunta', texto:$('nsMsg').value}; abrir('diario'); };
  // proposta oficial registrada (veio do PC): números do banco × conta própria
  const O = N.oferta_assessor;
  if (O && O.fonte === 'banco') {
    const lin = (rot, a, b) => `<div>${rot}</div><div>${a}</div><div>${b}</div>`;
    let q = `<div class="card"><div class="bloco-t">Proposta oficial registrada${O.data ? ' em ' + fD(O.data) : ''}</div>
      <p style="margin:0"><b>${fR(O.valor)} a ${fTaxa(O.taxa)} ao ano</b>${num(O.pct_cdi) ? ', pagando ' + O.pct_cdi.toLocaleString('pt-BR') + '% do CDI' : ''}${O.vencimento ? ', vencimento ' + fD(O.vencimento) : ''}.</p>`;
    if (O.condicoes_diferentes) q += `<div class="aviso" style="margin-top:8px">O percentual do CDI ou o vencimento desta proposta são diferentes dos usados na simulação desta tela (${cond}). As chances abaixo <b>não valem</b> para ela; peça para ampliar a simulação.</div>`;
    else if (num(O.custo_entrada_proprio) || num(O.saida_dia0)) {
      q += `<div class="duas"><div>No dia da entrada</div><div>Banco</div><div>Conta própria</div>` +
        lin('Taxa justa de mercado', num(O.taxa_justa_banco) ? fTaxa(O.taxa_justa_banco) : 'não informou', num(O.taxa_justa_propria) ? fTaxa(O.taxa_justa_propria) : '—') +
        lin('Valor de saída no primeiro dia', num(O.saida_dia0) ? fRs(O.saida_dia0) : 'não informou', num(O.custo_entrada_proprio) ? fRs(O.custo_entrada_proprio) : '—') + '</div>';
      if (num(O.saida_dia0) && num(O.custo_entrada_proprio)) { const df = O.saida_dia0 - O.custo_entrada_proprio;
        q += `<p class="peq" style="margin:8px 0 0">${Math.round(df) === 0 ? 'O valor do banco é igual ao da conta própria' : 'O valor do banco é ' + fR(df) + (df < 0 ? ' pior' : ' melhor') + ' para você do que a conta própria'}${Math.abs(df) > Math.max(2000, 0.02 * O.valor) ? '. É uma diferença grande: vale perguntar ao assessor de onde ela vem.' : ', dentro do esperado.'}</p>`; }
    }
    if (num(O.remuneracao)) q += `<p class="peq" style="margin:8px 0 0">Remuneração do banco e do escritório informada: ${fR(O.remuneracao)}.</p>`;
    $('nsOficial').innerHTML = q + '</div>';
  }
  // registrar a resposta do banco: vai para o diário (tabela que só aceita inserir) e o PC lê na próxima atualização
  if (!LOCAL && $('pBtn')) {
    if (!$('pData').value) $('pData').value = hojeISO();
    if (!$('pVenc').value && N.vencimento) $('pVenc').value = N.vencimento;
    if (!$('pCdi').value && num(N.pct_cdi)) $('pCdi').value = String(N.pct_cdi);
    $('pBtn').onclick = async () => {
      const pm = (t, tipo = '') => { $('pMsg').textContent = t; $('pMsg').className = 'msg ' + tipo; };
      const lePos = id => { const t = $(id).value.trim().replace(/%/g, ''); if (!t) return null; const v = numBR(t.replace(/^R\$\s*/, '')); return isFinite(v) ? v : NaN; };
      const lePct = id => { const t = $(id).value.trim().replace(/%/g, '').replace(/\s/g, ''); if (!t) return null; return /^\d{1,3}([.,]\d{1,4})?$/.test(t) ? Number(t.replace(',', '.')) : NaN; };
      const o = {valor: lePos('pValor'), taxa: lePct('pTaxa'), cdi: lePct('pCdi'), venc: $('pVenc').value, data: $('pData').value,
                 justa: lePct('pJusta'), saida: lerMeta($('pSaida').value), rem: lePos('pRem'), obs: $('pObs').value.trim()};
      if (!num(o.valor) || o.valor < 10000 || o.valor > 2000000) return pm('Informe o valor da operação (entre R$ 10 mil e R$ 2 milhões).', 'err');
      if (!num(o.taxa) || o.taxa < 5 || o.taxa > 40) return pm('Informe a taxa fixa em % ao ano (por exemplo, 19,00).', 'err');
      if (!num(o.cdi) || o.cdi < 80 || o.cdi > 200) return pm('Informe o percentual do CDI (por exemplo, 135).', 'err');
      if (!o.venc || o.venc <= hojeISO()) return pm('Informe o vencimento (uma data no futuro).', 'err');
      if (!o.data || o.data > hojeISO()) return pm('Informe a data da proposta (hoje ou antes).', 'err');
      if ([o.justa, o.rem].some(x => x != null && !num(x)) || (o.saida != null && isNaN(o.saida))) return pm('Algum valor opcional não foi reconhecido.', 'err');
      if (num(o.justa) && (o.justa < 5 || o.justa > 40)) return pm('A taxa justa informada parece fora do normal; confira.', 'err');
      $('pBtn').disabled = true; pm('Registrando…');
      const ins = await sb.from('contatos_assessor').insert({data_contato: o.data, swap: 'novo', tipo: 'resposta_banco', canal: 'email',
        texto: (linhaProposta(o) + '\n' + textoProposta(o)).slice(0, 2000), cotacao_informada: num(o.saida) ? o.saida : null});
      $('pBtn').disabled = false;
      if (ins.error) return pm('Não foi possível registrar: ' + ins.error.message, 'err');
      try { localStorage.setItem(CHAVE_OFERTA, JSON.stringify({valor: o.valor, taxa: o.taxa, data: o.data})); } catch (e) {}
      pm('Registrada no diário. Já aparece como “Última oferta do assessor” neste aparelho; a comparação com a conta própria entra na próxima atualização do PC (20h30).', 'ok');
      setTimeout(renderNovo, 2500);
    };
  }
  aplicar('mercado');
}

// ====================================================================================================
// 9b. INFLAÇÃO E JUROS (Brasil e EUA, 24 meses)
// ====================================================================================================
const MESES_EXT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const fMesAno = m => m ? MESES_EXT[+String(m).slice(5,7) - 1] + ' de ' + String(m).slice(0,4) : '—';
const fMesCurto = m => MESES[+String(m).slice(5,7) - 1] + '/' + String(m).slice(2,4);
const fP2 = v => num(v) ? v.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}) + '%' : '—';
const fVar = v => !num(v) ? '—' : (Math.abs(v) < 0.005 ? 'igual' : (v > 0 ? 'subiu ' : 'caiu ') + Math.abs(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}) + (Math.abs(v) >= 2 ? ' pontos' : ' ponto'));
// gráfico simples de linhas em % (SVG próprio). linhas: [{serie:[[rotulo, valor]], cor, tracejar:[rotulos]}]
function graficoPct(linhas, rotX){
  const W = 340, H = 150, pl = 34, pr = 8, pt = 8, pb = 20;
  const todos = linhas.flatMap(l => l.serie.map(p => p[1])); if (todos.length < 2) return '';
  let lo = Math.floor(Math.min(...todos) - 0.3), hi = Math.ceil(Math.max(...todos) + 0.3); if (hi - lo < 2) hi = lo + 2;
  const n = Math.max(...linhas.map(l => l.serie.length));
  const X = i => pl + (W - pl - pr) * i / (n - 1), Y = v => pt + (H - pt - pb) * (hi - v) / (hi - lo);
  let g = '';
  for (let v = lo; v <= hi; v += Math.max(1, Math.round((hi - lo) / 4))) g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="var(--line)" stroke-width="1"/><text x="${pl - 5}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${v}%</text>`;
  linhas.forEach(l => {
    const off = n - l.serie.length, d = l.serie.map((p, i) => (i ? 'L' : 'M') + X(i + off).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join('');
    g += `<path d="${d}" fill="none" stroke="${l.cor}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
    const u = l.serie[l.serie.length - 1]; g += `<circle cx="${X(n - 1).toFixed(1)}" cy="${Y(u[1]).toFixed(1)}" r="3.4" fill="${l.cor}"/>`;
  });
  g += `<text x="${pl}" y="${H - 5}">${esc(rotX[0])}</text><text x="${((pl + W - pr) / 2).toFixed(0)}" y="${H - 5}" text-anchor="middle">${esc(rotX[1])}</text><text x="${W - pr}" y="${H - 5}" text-anchor="end">${esc(rotX[2])}</text>`;
  return `<svg class="gpct" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico dos últimos 24 meses">${g}</svg>`;
}
function cartaoInflacao(titulo, B, nomeIndice, meta, extra){
  if (!B || !B.serie || B.serie.length < 2) return `<div class="card"><div class="bloco-t">${titulo}</div><p class="mut">Sem dados nesta atualização.</p></div>`;
  const T = B.tendencia || {}, of = B.serie.filter(p => !(B.estimados || []).includes(p[0]));
  const linhas = [{serie: of, cor: 'var(--s1)'}].concat(extra && extra.serie && extra.serie.length > 1 ? [{serie: extra.serie.filter(p => !(extra.estimados || []).includes(p[0])), cor: 'var(--am)'}] : []);
  const rx = [fMesCurto(of[0][0]), fMesCurto(of[Math.floor(of.length / 2)][0]), fMesCurto(of[of.length - 1][0])];
  return `<div class="card"><div class="bloco-t">${titulo}</div>
    <div class="grande" data-k="${B === (R.inflacao || {}).br ? 'ipca' : 'cpi'}">${fP2(B.ultimo.valor)}</div>
    <div class="sub-p">${nomeIndice} em 12 meses, até ${fMesAno(B.ultimo.mes)}.</div>
    <p style="margin:10px 0 0">Direção recente: <span class="tend">${esc(T.rotulo || '—')}</span></p>
    <div class="tres3"><div>em 3 meses<b>${fVar(T.var_3m)}</b></div><div>em 6 meses<b>${fVar(T.var_6m)}</b></div><div>em 12 meses<b>${fVar(T.var_12m)}</b></div></div>
    ${graficoPct(linhas, rx)}
    <div class="leg2"><span><i style="background:var(--s1)"></i>${nomeIndice}</span>${extra && extra.rotulo ? `<span><i style="background:var(--am)"></i>${extra.rotulo}</span>` : ''}</div>
    <p class="peq" style="margin:8px 0 0">Nos últimos 24 meses variou entre ${fP2(T.minimo_24m)} e ${fP2(T.maximo_24m)}. ${meta}</p>
    ${extra && extra.texto ? `<p class="peq" style="margin:6px 0 0">${extra.texto}</p>` : ''}
    ${B.estimativa_recente ? `<p class="peq" style="margin:6px 0 0">${fMesAno(B.estimativa_recente.mes)}: cerca de ${B.estimativa_recente.valor.toLocaleString('pt-BR', {minimumFractionDigits:1, maximumFractionDigits:1})}%. É uma estimativa: o índice do mesmo mês do ano anterior não foi publicado, então a comparação de 12 meses é aproximada e não entra no gráfico.</p>` : ''}
    ${B.focus && B.focus.anos ? `<p class="peq" style="margin:6px 0 0">O que o mercado espera (pesquisa do Banco Central de ${fD(B.focus.data)}): ${Object.entries(B.focus.anos).map(([a, v]) => fP2(v) + ' em ' + a).join(', ')}.</p>` : ''}</div>`;
}
function renderInflacao(){
  const sec = $('tela-inflacao');
  if (!R) { sec.innerHTML = vazioResumo(); return; }
  const I = R.inflacao, J = R.juros || {};
  if (!I) { sec.innerHTML = '<div class="card"><h2>Inflação e juros</h2><p class="mut">O resumo enviado pelo PC ainda não traz estes dados. Eles entram na próxima atualização.</p></div>'; return; }
  const E = I.eua, nuc = E && E.nucleo_ultimo;
  let h = `<div class="card"><div class="bloco-t">Por que olhar isto</div><p style="margin:0">Os seus swaps ganham quando os juros caem. Os bancos centrais só cortam juros com a inflação sob controle. <b>Inflação subindo = juros altos por mais tempo = mais demora para os swaps chegarem a zero.</b> Um novo swap é a mesma aposta: também perde se a inflação voltar a subir.</p></div>`;
  h += cartaoInflacao('Brasil', I.br, 'IPCA', 'A meta do Banco Central é 3% ao ano, com tolerância até 4,5%.', null);
  h += cartaoInflacao('Estados Unidos', E, 'Inflação ao consumidor', 'O objetivo do banco central americano é 2% ao ano.',
        nuc ? {serie: E.nucleo, estimados: E.estimados_nucleo, rotulo: 'Sem alimentos e energia', texto: `Tirando alimentos e energia, que oscilam muito, a inflação americana está em ${fP2(nuc.valor)} (${esc((E.nucleo_tendencia || {}).rotulo || '')}). Quando o índice cheio sobe e essa medida fica parada, a alta vem dos itens voláteis.`} : null);
  const jl = (rot, o, obs) => o ? `<div class="of"><div><b>${rot}</b><div class="peq">${obs}</div></div><div class="d">${fP2(o.hoje)}<div class="peq">há 3 meses: ${fP2(o.ha_3m)}<br>há 12 meses: ${fP2(o.ha_12m)}</div></div></div>` : '';
  h += `<div class="card"><div class="bloco-t">Juros hoje</div>
    ${num(J.selic) ? `<div class="of"><div><b>Juro básico do Brasil (Selic)</b><div class="peq">é o que define o CDI que você paga nos swaps</div></div><div class="d">${fP2(J.selic)}</div></div>` : ''}
    ${jl('Juros longos no Brasil', J.br_longo, 'taxa de mercado para cerca de 8 anos; é ela que move o valor de saída dos swaps')}
    ${jl('Juros de 10 anos nos EUA', J.eua_10a, 'quando sobem, costumam puxar os juros longos do Brasil para cima')}</div>`;
  h += `<div class="card"><div class="bloco-t">Sinais que o mercado acompanha</div>
    <p class="peq" style="margin:0 0 8px">Nenhum deles diz a hora certa de entrar ou sair. Eles mostram para que lado o risco está maior.</p>
    <ul class="lista-sinais">
      <li><b>Inflação em 12 meses e sua direção</b> (os dois quadros acima): é o que mais pesa na decisão dos bancos centrais.</li>
      <li><b>Expectativa de inflação do mercado</b> (pesquisa semanal do Banco Central): se sobe semana após semana, o corte de juros fica mais distante.</li>
      <li><b>Comunicados do Banco Central do Brasil e do americano</b>: dizem se o próximo passo é cortar, manter ou subir.</li>
      <li><b>Juros longos</b> (quadro acima): caindo por várias semanas, os swaps melhoram; subindo, pioram.</li>
      <li><b>Dólar e contas do governo</b>: dólar em alta e piora fiscal costumam empurrar os juros longos para cima.</li>
      <li><b>Juros de 10 anos dos EUA</b>: se sobem, dificultam a queda dos juros aqui.</li>
    </ul>
    <p class="peq" style="margin:0">O “Termômetro dos sinais”, em Painel técnico, soma vários desses itens todo dia.</p></div>`;
  h += `<p class="nota">Fontes: IBGE, pela série do Banco Central (IPCA); BLS, o instituto de estatísticas do trabalho dos EUA (inflação americana); Tesouro americano (juros de 10 anos). “Direção recente” compara a taxa de hoje com a de 3 e 6 meses atrás; não é previsão.</p>`;
  sec.innerHTML = h;
}

// ====================================================================================================
// 10. O QUE PEDIR AO BANCO
// ====================================================================================================
function renderRoteiro(){
  const sec = $('tela-roteiro');
  if (!R) { sec.innerHTML = vazioResumo(); return; }
  const itens = R.roteiro || [];
  if (!itens.length) { sec.innerHTML = '<div class="card"><p>Nenhum item neste resumo.</p></div>'; return; }
  sec.innerHTML = '<p class="mut">Pedidos que vale fazer ao assessor. Cada botão só abre o rascunho: quem envia é você.</p>' + itens.map((it, i) => `<div class="card" data-i="${i}">
    <h2>${esc(it.titulo)}</h2><p class="peq">${esc(it.porque)}</p>
    <details style="margin:8px 0"><summary>Ver a mensagem</summary><textarea class="msgbox" readonly rows="7" style="margin-top:10px"></textarea></details>
    <div class="acoes"><a class="btn prim" data-mail target="_blank" rel="noopener" href="#">Abrir e-mail</a><a class="btn" data-wa target="_blank" rel="noopener" href="#">Abrir WhatsApp</a><button type="button" class="btn" data-copiar>Copiar mensagem</button></div></div>`).join('');
  sec.querySelectorAll('.card[data-i]').forEach(c => {
    const it = itens[+c.dataset.i], ta = c.querySelector('textarea'), txt = String(it.mensagem || '').replace(/\{saudacao\}/g, saud()),
          L = linksContato(it.titulo || 'Pedido', txt);
    ta.value = txt;
    c.querySelector('[data-mail]').href = L.mail; c.querySelector('[data-wa]').href = L.wa;
    c.querySelector('[data-copiar]').onclick = e => copiarTexto(ta, e.currentTarget);
  });
}

// ====================================================================================================
// 10b. DIÁRIO DO ASSESSOR (tabela contatos_assessor: só inserir e ler; ninguém altera nem apaga)
// ====================================================================================================
let PRE_DIARIO = null, DIARIO = [];
const D_SWAP = {s30a:'2030 menor', s35:'2035', s30b:'2030 maior', carteira:'Os três (carteira)', novo:'Proposta de novo swap', geral:'Assunto geral'};
const D_TIPO = {cotacao:'Pedido de cotação', ordem_condicionada:'Pedido de encerramento com valor mínimo', ordem_mercado:'Pedido de encerramento a mercado',
                pergunta:'Pergunta ou pedido de documento', resposta_banco:'Resposta do banco', outro:'Outro'};
const D_CANAL = {email:'e-mail', whatsapp:'WhatsApp', telefone:'telefone', presencial:'pessoalmente', outro:'outro'};
const hojeISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
function renderDiario(){
  $('dLista').innerHTML = DIARIO.length ? DIARIO.map(r => `<div class="card">
      <div class="peq"><b>${fD(r.data_contato)}</b> · ${esc(D_SWAP[r.swap] || r.swap)} · ${esc(D_TIPO[r.tipo] || r.tipo)} · por ${esc(D_CANAL[r.canal] || r.canal)}</div>
      ${r.cotacao_informada != null ? `<div style="margin-top:6px">Valor informado pelo banco: <b class="${cor(+r.cotacao_informada)}">${fRs(+r.cotacao_informada)}</b></div>` : ''}
      <p style="white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0 0">${esc(String(r.texto || '').replace(/^PROPOSTA\|[^\n]*\n?/, ''))}</p>
      <div class="nota" style="margin:6px 0 0">anotado em ${fdt(r.criado_em)}</div></div>`).join('')
    : '<div class="card"><p class="mut">Nenhum registro ainda.</p></div>';
}
async function mostrarDiario(){
  const m = (t, tipo='') => { $('dMsg').textContent = t; $('dMsg').className = 'msg ' + tipo; };
  if (!$('dData').value) $('dData').value = hojeISO();
  if (PRE_DIARIO) { $('dSwap').value = PRE_DIARIO.swap; $('dTipo').value = PRE_DIARIO.tipo; $('dTexto').value = PRE_DIARIO.texto; $('dCanal').value = 'email'; PRE_DIARIO = null; m('Confira, ajuste o que for preciso e toque em Registrar.'); }
  $('dCot').oninput = () => { const v = lerMeta($('dCot').value);
    $('dCotPrev').innerHTML = v == null ? '' : isNaN(v) ? 'valor não reconhecido' : 'banco informou: <b class="' + cor(v) + '">' + fRs(v) + '</b>' + (v < 0 ? ' (contra você)' : v > 0 ? ' (a seu favor)' : ''); };
  $('dBtn').onclick = async () => {
    const cot = lerMeta($('dCot').value), texto = $('dTexto').value.trim();
    if (!$('dData').value) return m('Informe a data do contato.', 'err');
    if ($('dData').value > hojeISO()) return m('A data não pode ser no futuro.', 'err');
    if (!texto) return m('Escreva o que foi pedido ou respondido.', 'err');
    if (cot != null && (isNaN(cot) || Math.abs(cot) > 2000000)) return m('O valor informado não foi reconhecido.', 'err');
    $('dBtn').disabled = true; m('Registrando…');
    const ins = await sb.from('contatos_assessor').insert({data_contato: $('dData').value, swap: $('dSwap').value, tipo: $('dTipo').value,
      canal: $('dCanal').value, texto: texto.slice(0, 2000), cotacao_informada: cot});
    $('dBtn').disabled = false;
    if (ins.error) return m('Não foi possível registrar: ' + ins.error.message, 'err');
    m('Registrado.', 'ok'); $('dTexto').value = ''; $('dCot').value = ''; $('dCotPrev').textContent = '';
    carregarDiario();
  };
  $('dCsv').onclick = () => baixarCSV('diario_assessor.csv', DIARIO);
  carregarDiario();
}
async function carregarDiario(){
  const { data, error } = await sb.from('contatos_assessor').select('data_contato,swap,tipo,canal,cotacao_informada,texto,criado_em').order('data_contato', {ascending:false}).order('id', {ascending:false}).limit(200);
  if (error) { $('dLista').innerHTML = '<div class="card"><p>Erro ao ler o diário: ' + esc(error.message) + '</p></div>'; return; }
  DIARIO = data || []; renderDiario();
}

// ====================================================================================================
// 11. TELAS TÉCNICAS DO CELULAR (movidas sem alteração: Dados e Enviar)
// ====================================================================================================
const brl = v => v==null ? '—' : (v<0?'−':'+') + 'R$ ' + Math.abs(Math.round(v)).toLocaleString('pt-BR');
const cl = v => v==null ? '' : (v<0 ? 'neg' : 'pos');
const pc = v => v==null ? '—' : (+v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2}) + '%';
function baixarCSV(nome, linhas){
  if (!linhas.length) return;
  const cols = Object.keys(linhas[0]);
  const txt = [cols.join(';'), ...linhas.map(r => cols.map(c => r[c]==null ? '' : String(r[c]).replace('.', ',')).join(';'))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + txt], {type:'text/csv'})); a.download = nome; a.click();
}
async function mostrarDados(){
  $('dados').classList.remove('hidden');
  $('info').textContent = 'Dados guardados no banco (Supabase)';
  const [s, h] = await Promise.all([
    sb.from('sinais').select('*').order('data_curva', {ascending:false}).limit(60),
    sb.from('historico_diario').select('*').order('data', {ascending:false}).limit(400)]);
  if (s.error || h.error) { $('dados').textContent = 'Erro: ' + (s.error || h.error).message; return; }
  const S = s.data, Hh = h.data;
  $('dados').innerHTML = `
    <h1>Registro das atualizações</h1>
    <div class="tw"><table><tr><th>Curva de</th><th>Valor de saída</th><th>Dia</th><th>Semana</th><th>Mês</th><th>Precisa cair</th></tr>
    ${S.map(r=>`<tr><td>${r.data_curva.split('-').reverse().join('/')}</td><td class="${cl(r.total)}">${brl(r.total)}</td><td class="${cl(r.var_dia)}">${brl(r.var_dia)}</td><td class="${cl(r.var_semana)}">${brl(r.var_semana)}</td><td class="${cl(r.var_mes)}">${brl(r.var_mes)}</td><td>${(+r.falta_pontos).toLocaleString('pt-BR',{maximumFractionDigits:2})} p.</td></tr>`).join('')}
    </table></div>
    <p><button id="csvS">Baixar registro (CSV)</button></p>
    <h1 style="margin-top:22px">Histórico diário (últimos 60 dias)</h1>
    <div class="tw"><table><tr><th>Data</th><th>Longa</th><th>Média</th><th>Curta</th><th>2035</th><th>2030 menor</th><th>2030 maior</th><th>Total</th></tr>
    ${Hh.slice(0,60).map(r=>`<tr><td>${r.data.split('-').reverse().join('/')}</td><td>${pc(r.longa)}</td><td>${pc(r.media)}</td><td>${pc(r.curta)}</td><td class="${cl(r.s35)}">${brl(r.s35)}</td><td class="${cl(r.s30a)}">${brl(r.s30a)}</td><td class="${cl(r.s30b)}">${brl(r.s30b)}</td><td class="${cl(r.total)}">${brl(r.total)}</td></tr>`).join('')}
    </table></div>
    <p><button id="csvH">Baixar histórico completo (CSV)</button></p>
    <p class="mut">Estimativas do modelo do painel, calibrado no valor oficial do banco. O valor oficial é o que o banco informar.</p>`;
  $('csvS').onclick = () => baixarCSV('sinais.csv', S);
  $('csvH').onclick = async () => { const all = await sb.from('historico_diario').select('*').order('data'); baixarCSV('historico_diario.csv', all.data || []); };
}
// ---------- metas de saída
// aqui o sinal é o que você digitar: "-20.000" = perda de 20 mil; "0" = zero; "5.000" = ganho de 5 mil
function lerMeta(txt){
  let t = String(txt == null ? '' : txt).trim().replace(/R\$|\s/g,'').replace(/−/g,'-');
  if (!t) return null;
  const neg = t.startsWith('-'); t = t.replace(/^[-+]/,'');
  const v = numBR(t); if (!isFinite(v)) return NaN;
  return neg && v !== 0 ? -v : v;
}
const fMeta = v => v == null ? '—' : (+v === 0 ? 'zero (sem perda)' : (v<0?'−':'+') + 'R$ ' + Math.abs(+v).toLocaleString('pt-BR',{maximumFractionDigits:0}));
const LIM_META = {m30a:100000, m35:400000, m30b:300000};
[['m30a','pm30a'],['m35','pm35'],['m30b','pm30b']].forEach(([i,p]) => $(i).addEventListener('input', () => {
  const v = lerMeta($(i).value);
  $(p).innerHTML = v == null ? '' : isNaN(v) ? 'valor não reconhecido' : Math.abs(v) > LIM_META[i] ? '<span class="neg">valor fora do limite</span>' : 'nova meta: <b class="'+(v<0?'neg':'pos')+'">'+fMeta(v)+'</b>';
}));
async function carregarMetas(){
  const { data, error } = await sb.from('metas_saida').select('criado_em,s35,s30a,s30b,status').order('criado_em',{ascending:false}).limit(8);
  if (error) { $('mHist').innerHTML = '<tr><td>Erro: '+error.message+'</td></tr>'; return; }
  const vig = {}; (data||[]).slice().reverse().forEach(r => { if (String(r.status).startsWith('aplicado')) ['s30a','s35','s30b'].forEach(k => { if (r[k] != null) vig[k] = r[k]; }); });
  $('m30a').placeholder = 'atual: ' + fMeta(vig.s30a); $('m35').placeholder = 'atual: ' + fMeta(vig.s35); $('m30b').placeholder = 'atual: ' + fMeta(vig.s30b);
  $('mHist').innerHTML = '<tr><th>Pedido em</th><th>2030 menor</th><th>2035</th><th>2030 maior</th><th>Situação</th></tr>' +
    (data||[]).map(r => '<tr><td>'+fdt(r.criado_em)+'</td><td>'+fMeta(r.s30a)+'</td><td>'+fMeta(r.s35)+'</td><td>'+fMeta(r.s30b)+'</td><td style="white-space:normal;text-align:left">'+r.status+'</td></tr>').join('');
}
$('mBtn').onclick = async () => {
  const mMsg = (t, tipo='') => { $('mMsg').textContent = t; $('mMsg').className = 'msg ' + tipo; };
  const v = {s30a: lerMeta($('m30a').value), s35: lerMeta($('m35').value), s30b: lerMeta($('m30b').value)};
  if (Object.values(v).every(x => x == null)) return mMsg('Digite pelo menos uma meta.', 'err');
  if (Object.values(v).some(x => x != null && isNaN(x))) return mMsg('Algum valor não foi reconhecido.', 'err');
  if ((v.s30a!=null && Math.abs(v.s30a)>LIM_META.m30a) || (v.s35!=null && Math.abs(v.s35)>LIM_META.m35) || (v.s30b!=null && Math.abs(v.s30b)>LIM_META.m30b)) return mMsg('Valor fora do limite para o tamanho do swap.', 'err');
  $('mBtn').disabled = true; mMsg('Salvando…');
  const ins = await sb.from('metas_saida').insert(v);
  $('mBtn').disabled = false;
  if (ins.error) return mMsg('Não foi possível salvar: ' + ins.error.message, 'err');
  mMsg('Metas salvas. O PC aplica na próxima atualização.', 'ok');
  ['m30a','m35','m30b'].forEach(i => { $(i).value = ''; }); ['pm30a','pm35','pm30b'].forEach(i => $(i).textContent = '');
  carregarMetas();
};
// ---------- envio pelo celular
// valor digitado como no extrato do banco: "-12.345,67", "R$ 12.345,67" ou "12345.67".
// Sem sinal = prejuízo (negativo), como aparece no print. Só fica positivo se digitar "+".
// Formato estrito: qualquer coisa fora dele ("-" sozinho, "88,774", "1,234.56", "1e5") é recusada.
function numBR(t){
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) return Number(t.replace(/\./g,'').replace(',', '.'));   // 12.345,67
  if (/^\d+(,\d{1,2})?$/.test(t)) return Number(t.replace(',', '.'));                                     // 12345,67 ou 12345
  if (/^\d+\.\d{2}$/.test(t)) return Number(t);                                                           // 12345.67
  return NaN;
}
function lerValor(txt){
  let t = String(txt == null ? '' : txt).trim().replace(/R\$|\s/g,'').replace(/−/g,'-');
  if (!t) return null;
  const pos = t.startsWith('+'); t = t.replace(/^[-+]/,'');
  const v = numBR(t); if (!isFinite(v)) return NaN;
  return pos ? v : (v === 0 ? 0 : -v);
}
const fmtR = v => (v<0?'−':'+') + 'R$ ' + Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2, maximumFractionDigits:2});
function prever(){
  let soma = 0, ok = true;
  [['e35','p35'],['e30a','p30a'],['e30b','p30b']].forEach(([i,p]) => {
    const v = lerValor($(i).value);
    if (v == null) { $(p).textContent = ''; ok = false; }
    else if (isNaN(v)) { $(p).textContent = 'valor não reconhecido'; ok = false; }
    else { $(p).innerHTML = 'será registrado como <b class="'+(v<0?'neg':'pos')+'">'+fmtR(v)+'</b>'; soma += v; }
  });
  const tt = lerValor($('eTot').value);
  $('pTot').innerHTML = ok ? ('soma dos 3: <b>'+fmtR(soma)+'</b>' + (tt!=null && !isNaN(tt) ? (Math.abs(tt-soma)<=2 ? ' · <span class="pos">confere</span>' : ' · <span class="neg">não confere com o total</span>') : '')) : '';
}
['e35','e30a','e30b','eTot'].forEach(i => $(i).addEventListener('input', prever));
async function mostrarEnviar(){
  $('enviar').classList.remove('hidden');
  carregarMetas();
  $('info').textContent = 'Os envios ficam numa área privada; só o seu login grava e lê.';
  if (!$('eData').value) $('eData').value = new Date(Date.now() - new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
  const { data, error } = await sb.from('posicao_informada').select('criado_em,data_ref,s35,s30a,s30b,arquivo,status').order('criado_em',{ascending:false}).limit(10);
  $('eHist').innerHTML = error ? '<tr><td>Erro: '+error.message+'</td></tr>' :
    '<tr><th>Enviado</th><th>Posição de</th><th>Total</th><th>Situação</th></tr>' +
    (data||[]).map(r => { const t = [r.s35,r.s30a,r.s30b].every(x=>x!=null) ? (+r.s35)+(+r.s30a)+(+r.s30b) : null;
      return '<tr><td>'+fdt(r.criado_em)+'</td><td>'+r.data_ref.split('-').reverse().join('/')+'</td><td class="'+(t==null?'':cl(t))+'">'+(t==null?'só arquivo':brl(t))+'</td><td style="white-space:normal;text-align:left">'+r.status+'</td></tr>'; }).join('');
}
$('eBtn').onclick = async () => {
  const eMsg = (t, tipo='') => { $('eMsg').textContent = t; $('eMsg').className = 'msg ' + tipo; };
  const data_ref = $('eData').value, arq = $('eArq').files[0];
  const vals = ['e35','e30a','e30b'].map(i => lerValor($(i).value));
  const algum = vals.some(v => v != null), todos = vals.every(v => v != null && !isNaN(v));
  if (!data_ref) return eMsg('Informe a data da posição.', 'err');
  if (!arq && !todos) return eMsg('Anexe o arquivo ou preencha os 3 valores.', 'err');
  if (algum && !todos) return eMsg('Preencha os 3 valores (ou deixe os 3 em branco e envie só o arquivo).', 'err');
  if (arq && arq.size > 10*1024*1024) return eMsg('Arquivo maior que 10 MB.', 'err');
  const tot = lerValor($('eTot').value);
  if (todos && tot != null && !isNaN(tot) && Math.abs(tot - vals.reduce((a,b)=>a+b,0)) > 2) return eMsg('A soma dos 3 valores não confere com o total. Confira antes de enviar.', 'err');
  $('eBtn').disabled = true; eMsg('Enviando…');
  try {
    let caminho = null;
    if (arq) {
      const ext = (arq.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g,'');
      caminho = data_ref + '_' + Date.now() + '.' + ext;
      const up = await sb.storage.from('entrada').upload(caminho, arq, { contentType: arq.type || undefined, upsert:false });
      if (up.error) throw up.error;
    }
    const ins = await sb.from('posicao_informada').insert({ data_ref, arquivo: caminho,
      s35: todos ? vals[0] : null, s30a: todos ? vals[1] : null, s30b: todos ? vals[2] : null,
      total_informado: (todos && tot!=null && !isNaN(tot)) ? tot : null, observacao: $('eObs').value.trim() || null });
    if (ins.error) throw ins.error;
    eMsg('Enviado. O PC vai processar na próxima atualização (20h30).', 'ok');
    ['eArq','e35','e30a','e30b','eTot','eObs'].forEach(i => $(i).value = ''); prever();
    mostrarEnviar();
  } catch (e) { eMsg('Não foi possível enviar: ' + (e.message || e), 'err'); }
  finally { $('eBtn').disabled = false; }
};
if (sb) sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_OUT') location.reload(); });

// ====================================================================================================
// 12. PARTIDA
// ====================================================================================================
if (LOCAL) {
  try { mostrarAppLocal(); }
  catch (e) { $('app').classList.remove('hidden'); $('conteudo').innerHTML = '<div class="card"><h2>Não foi possível ler o resumo local</h2><p class="mut">' + esc(e.message || e) + '</p></div>'; }
} else iniciar();

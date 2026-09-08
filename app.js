'use strict';

// ZEN V1.1 — defensive startup: one error must never leave the app on a blank screen.
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));

const DEFAULT_STATE = {
  theme: 'dark', language: 'fr', bg: null,
  titles: { notes: 'note idée', projects: 'projet', motivation: 'motivation' },
  notes: [], projects: [],
  quotes: ['“easy choices now make harder life, harder choices now makes easy life”']
};

function cloneDefault(){ return JSON.parse(JSON.stringify(DEFAULT_STATE)); }
function loadState(){
  try {
    const raw = localStorage.getItem('ZEN_STATE');
    if (!raw) return cloneDefault();
    const saved = JSON.parse(raw);
    const base = cloneDefault();
    return {
      ...base, ...saved,
      titles: {...base.titles, ...(saved.titles || {})},
      notes: Array.isArray(saved.notes) ? saved.notes : [],
      projects: Array.isArray(saved.projects) ? saved.projects.map(p => ({...p, notes:Array.isArray(p.notes)?p.notes:[], photos:Array.isArray(p.photos)?p.photos:[]})) : [],
      quotes: Array.isArray(saved.quotes) && saved.quotes.length ? saved.quotes : base.quotes
    };
  } catch(e){
    console.warn('ZEN: état local illisible, retour aux valeurs par défaut.', e);
    return cloneDefault();
  }
}
let state = loadState();
let currentScreen = 'home';
let currentNoteFilter = 'all';

function save(){ try { localStorage.setItem('ZEN_STATE', JSON.stringify(state)); } catch(e) { console.warn('ZEN: sauvegarde impossible', e); } }
function escapeHtml(value){ return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function pad(n){ return String(n).padStart(2,'0'); }
function nowString(){ const d=new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function updateClocks(){
  const t=nowString();
  ['homeClock','notesClock','projectsClock','motivationClock','zenTime'].forEach(id=>{ const el=$('#'+id); if(el) el.textContent=t; });
}
setInterval(updateClocks, 1000);

function toast(message){
  const el=$('#toast'); if(!el) return;
  el.textContent=message; el.classList.add('show');
  clearTimeout(window.__zenToast); window.__zenToast=setTimeout(()=>el.classList.remove('show'),1800);
}

function go(screen){
  const target = $('#screen-'+screen);
  if(!target) return;
  currentScreen=screen;
  $$('.screen').forEach(s=>s.classList.remove('active'));
  target.classList.add('active');
  render();
}
function showZen(){ $('#zenScreen')?.classList.remove('hidden'); updateClocks(); }
function hideZen(){ $('#zenScreen')?.classList.add('hidden'); }

function modal(content){
  const m=$('#modal'), c=$('#modalContent');
  if(!m || !c) return;
  c.innerHTML=content; m.classList.remove('hidden');
}
function closeModal(){ $('#modal')?.classList.add('hidden'); if($('#modalContent')) $('#modalContent').innerHTML=''; }

function renderNotes(){
  const label=$('#notesLabel'), list=$('#notesList'); if(!label||!list)return;
  label.textContent=state.titles.notes;
  const notes=currentNoteFilter==='important' ? state.notes.filter(n=>n.important) : state.notes;
  list.innerHTML=notes.length ? notes.map(n=>`<div class="note-row">
    <button class="note-text" data-edit-note="${escapeHtml(n.id)}">${escapeHtml(n.text)}</button>
    <button class="note-btn ${n.important?'important':''}" data-important="${escapeHtml(n.id)}" title="Idée importante">★</button>
    <button class="note-btn" data-delete-note="${escapeHtml(n.id)}" title="Supprimer">×</button>
  </div>`).join('') : '<div class="empty-state">aucune note ici</div>';
}

function openNoteEditor(id){
  const note=state.notes.find(n=>String(n.id)===String(id));
  if(!note)return;
  modal(`<h2>modifier la note</h2><textarea id="noteText">${escapeHtml(note.text)}</textarea><div class="modal-actions"><button class="secondary" data-close-modal>annuler</button><button class="primary" id="saveEditedNote">enregistrer</button></div>`);
  $('#saveEditedNote').onclick=()=>{ const v=$('#noteText').value.trim(); if(v)note.text=v; save(); closeModal(); renderNotes(); };
}
function newNote(){
  modal(`<h2>nouvelle note</h2><textarea id="noteText" placeholder="écris ton idée…"></textarea><div class="modal-actions"><button class="secondary" data-close-modal>annuler</button><button class="primary" id="createNote">ajouter</button></div>`);
  $('#createNote').onclick=()=>{ const v=$('#noteText').value.trim(); if(!v)return; state.notes.unshift({id:Date.now()+Math.random(),text:v,important:false}); save(); closeModal(); renderNotes(); };
}

function renderProjects(){
  const label=$('#projectsLabel'), list=$('#projectsList'); if(!label||!list)return;
  label.textContent=state.titles.projects;
  list.innerHTML=state.projects.length ? state.projects.map(p=>`<article class="project-card"><strong>${escapeHtml(p.name)}</strong><span class="project-meta">${p.notes.length} note(s) · ${p.photos.length} photo(s)</span><button data-project="${escapeHtml(p.id)}">ouvrir</button></article>`).join('') : '<div class="empty-state project-empty">aucun projet — crée ton premier dossier avec ＋</div>';
}
function newProject(){
  modal(`<h2>nouveau projet</h2><input id="projectName" placeholder="nom du projet"><div class="modal-actions"><button class="secondary" data-close-modal>annuler</button><button class="primary" id="createProject">créer</button></div>`);
  $('#createProject').onclick=()=>{const name=$('#projectName').value.trim();if(!name)return;state.projects.unshift({id:Date.now()+Math.random(),name,notes:[],photos:[]});save();closeModal();renderProjects();};
}
function openProject(id){
  const p=state.projects.find(x=>String(x.id)===String(id)); if(!p)return;
  modal(`<h2>${escapeHtml(p.name)}</h2><textarea id="projectNote" placeholder="ajouter une note au projet…"></textarea><label class="file-btn">ajouter une photo<input id="projectPhoto" type="file" accept="image/*"></label><div id="projectPhotos" class="project-photos">${p.photos.map(x=>`<img class="photo-preview" src="${x}" alt="">`).join('')}</div><h3>notes</h3><div id="projectNotes">${p.notes.map(n=>`<div class="project-note">${escapeHtml(n)}</div>`).join('')||'<span class="muted">aucune note</span>'}</div><div class="modal-actions"><button class="secondary" id="deleteProject">supprimer</button><button class="primary" id="saveProject">enregistrer</button></div>`);
  $('#saveProject').onclick=()=>{
    const note=$('#projectNote').value.trim(); if(note)p.notes.push(note);
    const file=$('#projectPhoto').files[0];
    if(file){ const r=new FileReader(); r.onload=()=>{p.photos.push(r.result);save();closeModal();renderProjects();}; r.readAsDataURL(file); }
    else {save();closeModal();renderProjects();}
  };
  $('#deleteProject').onclick=()=>{if(confirm('Supprimer ce projet ?')){state.projects=state.projects.filter(x=>String(x.id)!==String(id));save();closeModal();renderProjects();}};
}

function renderQuotes(){
  const label=$('#motivationLabel'), main=$('#motivationQuote'), list=$('#quotesList'); if(!label||!main||!list)return;
  label.textContent=state.titles.motivation; main.textContent=state.quotes[0]||'';
  list.innerHTML=state.quotes.slice(1).map((q,i)=>`<div class="quote-card" data-quote-index="${i+1}">${escapeHtml(q)}<button class="quote-delete" title="Supprimer">×</button></div>`).join('');
}
function newQuote(){
  modal(`<h2>nouvelle quote</h2><textarea id="quoteText" placeholder="écris ta quote…"></textarea><div class="modal-actions"><button class="secondary" data-close-modal>annuler</button><button class="primary" id="createQuote">ajouter</button></div>`);
  $('#createQuote').onclick=()=>{const q=$('#quoteText').value.trim();if(!q)return;state.quotes.push(q);save();closeModal();renderQuotes();};
}
function renameMenu(key){
  modal(`<h2>renommer le menu</h2><input id="titleValue" value="${escapeHtml(state.titles[key])}"><div class="modal-actions"><button class="secondary" data-close-modal>annuler</button><button class="primary" id="saveTitle">enregistrer</button></div>`);
  $('#saveTitle').onclick=()=>{const v=$('#titleValue').value.trim();if(v)state.titles[key]=v;save();closeModal();render();};
}

function applySettings(){
  document.body.classList.toggle('light',state.theme==='light');
  const bg=$('#backgroundLayer');
  if(bg) bg.style.backgroundImage=`url("${state.bg || 'assets/dubai.jpg'}")`;
  const theme=$('#themeSelect'), lang=$('#languageSelect');
  if(theme)theme.value=state.theme; if(lang)lang.value=state.language;
}
function render(){ renderNotes();renderProjects();renderQuotes();applySettings();updateClocks(); }

function bind(){
  $$('.home-trigger').forEach(b=>b.onclick=()=>go('home'));
  $$('.settings-trigger').forEach(b=>b.onclick=()=>go('settings'));
  $$('.zen-trigger').forEach(b=>b.onclick=showZen);
  $$('.shortcut').forEach(b=>b.onclick=()=>go(b.dataset.go));
  $('#zenExit')?.addEventListener('click',hideZen);
  $('#modalClose')?.addEventListener('click',closeModal);
  $('#modal')?.addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
  $('#addNoteBtn')?.addEventListener('click',newNote);
  $('#addProjectBtn')?.addEventListener('click',newProject);
  $('#addQuoteBtn')?.addEventListener('click',newQuote);
  $$('.pill-nav').forEach(b=>b.onclick=()=>{currentNoteFilter=b.dataset.filter;renderNotes();});
  $$('.edit-title').forEach(b=>b.onclick=()=>renameMenu(b.dataset.title));
  document.addEventListener('click',e=>{
    const edit=e.target.closest('[data-edit-note]'); if(edit){openNoteEditor(edit.dataset.editNote);return;}
    const imp=e.target.closest('[data-important]'); if(imp){const n=state.notes.find(x=>String(x.id)===String(imp.dataset.important));if(n){n.important=!n.important;save();renderNotes();}return;}
    const del=e.target.closest('[data-delete-note]'); if(del){state.notes=state.notes.filter(x=>String(x.id)!==String(del.dataset.deleteNote));save();renderNotes();return;}
    const proj=e.target.closest('[data-project]'); if(proj){openProject(proj.dataset.project);return;}
    const qdel=e.target.closest('.quote-delete'); if(qdel){const card=qdel.closest('[data-quote-index]');const i=Number(card.dataset.quoteIndex);state.quotes.splice(i,1);save();renderQuotes();return;}
    if(e.target.closest('[data-close-modal]'))closeModal();
  });
  $('#themeSelect')?.addEventListener('change',e=>{state.theme=e.target.value;save();applySettings();});
  $('#languageSelect')?.addEventListener('change',e=>{state.language=e.target.value;save();toast(e.target.value==='fr'?'français activé':'English enabled');});
  $('#useDefaultBg')?.addEventListener('click',()=>{state.bg=null;save();applySettings();toast('fond restauré');});
  $('#bgInput')?.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{state.bg=r.result;save();applySettings();toast('fond modifié');};r.readAsDataURL(f);});
  $('#resetData')?.addEventListener('click',()=>{if(confirm('Réinitialiser toutes les données de ZEN ?')){state=cloneDefault();save();render();toast('données réinitialisées');}});
}

function splash(){
  const sp=$('#sparkles');
  if(sp){for(let i=0;i<34;i++){const s=document.createElement('i');s.className='spark';s.style.left=(5+Math.random()*90)+'%';s.style.top=(5+Math.random()*85)+'%';s.style.animationDelay=(-Math.random()*2.6)+'s';s.style.animationDuration=(1.8+Math.random()*2)+'s';sp.appendChild(s);}}
  // Always reveal the app, even if a non-critical startup operation fails.
  setTimeout(()=>{$('#splash')?.classList.add('hidden');$('#mainApp')?.classList.remove('hidden');},1200);
}

window.addEventListener('error',e=>{console.error('ZEN startup/runtime error:',e.error||e.message);$('#splash')?.classList.add('hidden');$('#mainApp')?.classList.remove('hidden');});
window.addEventListener('unhandledrejection',e=>console.error('ZEN promise error:',e.reason));

(function start(){
  try { bind(); render(); splash(); }
  catch(e){
    console.error('ZEN fatal startup error:',e);
    // Minimal emergency UI: never leave the user at a blank screen.
    $('#splash')?.classList.add('hidden');$('#mainApp')?.classList.remove('hidden');
    go('home');
  }
  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=11').catch(console.warn));}
})();

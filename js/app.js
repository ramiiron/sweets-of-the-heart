"use strict";
const APP_VERSION = "1.2.0";
/* ===== Datos iniciales (precios reales del flyer; insumos y recetas son EJEMPLOS) ===== */
const SEED = {
  marginPct: 40,
  hourlyRate: 15,
  overheadPct: 10,
  quotes: [],
  quoteSeq: 0,
  ingredients: [
    {id:"harina",   name:"Harina todo uso",      price:4.50, pkg:5,    unit:"lb",    density:120},
    {id:"azucar",   name:"Azúcar granulada",     price:3.80, pkg:4,    unit:"lb",    density:200},
    {id:"huevos",   name:"Huevos",               price:4.20, pkg:12,   unit:"und"},
    {id:"manteq",   name:"Mantequilla",          price:4.50, pkg:1,    unit:"lb",    density:227},
    {id:"lcond",    name:"Leche condensada",     price:2.20, pkg:14,   unit:"oz",    density:310},
    {id:"levap",    name:"Leche evaporada",      price:1.80, pkg:12,   unit:"oz",    density:252},
    {id:"crema",    name:"Crema para batir",     price:4.00, pkg:16,   unit:"fl oz", density:240},
    {id:"limon",    name:"Limones",              price:3.00, pkg:6,    unit:"und"},
    {id:"framb",    name:"Frambuesas",           price:4.00, pkg:6,    unit:"oz",    density:120},
    {id:"marac",    name:"Pulpa de maracuyá",    price:5.00, pkg:14,   unit:"oz",    density:240},
    {id:"fruta",    name:"Fruta mixta",          price:5.00, pkg:2,    unit:"lb",    density:150},
    {id:"aglass",   name:"Azúcar glass",         price:3.00, pkg:2,    unit:"lb",    density:120},
    {id:"vain",     name:"Vainilla",             price:6.00, pkg:2,    unit:"fl oz", density:208},
    {id:"phornear", name:"Polvo de hornear",     price:3.50, pkg:10,   unit:"oz",    density:220},
    {id:"caja9",    name:"Caja para pie 9\u2033", price:1.50, pkg:1,    unit:"und"},
    {id:"base10",   name:"Base dorada 10\u2033",  price:0.80, pkg:1,    unit:"und"}
  ],
  products: [
    {id:"pie-limon",  name:"Lemon Meringue Pie",  price:23,   portions:8,  packaging:1.50, recipe:[
      {ing:"harina",qty:2,unit:"taza"},{ing:"manteq",qty:0.5,unit:"taza"},{ing:"azucar",qty:1.5,unit:"taza"},{ing:"huevos",qty:4,unit:"und"},{ing:"limon",qty:6,unit:"und"},{ing:"aglass",qty:1,unit:"taza"}]},
    {id:"pie-framb",  name:"Raspberry Pie",       price:23,   portions:8,  packaging:1.50, recipe:[
      {ing:"harina",qty:2,unit:"taza"},{ing:"manteq",qty:0.5,unit:"taza"},{ing:"azucar",qty:1,unit:"taza"},{ing:"huevos",qty:2,unit:"und"},{ing:"framb",qty:12,unit:"oz"}]},
    {id:"pie-marac",  name:"Passion Fruit Pie",   price:25,   portions:8,  packaging:1.50, recipe:[
      {ing:"harina",qty:2,unit:"taza"},{ing:"manteq",qty:0.5,unit:"taza"},{ing:"azucar",qty:1.25,unit:"taza"},{ing:"huevos",qty:4,unit:"und"},{ing:"marac",qty:14,unit:"oz"}]},
    {id:"tart-frut",  name:"Fruit Tart",          price:20,   portions:8,  packaging:1.50, recipe:[
      {ing:"harina",qty:1.5,unit:"taza"},{ing:"manteq",qty:0.5,unit:"taza"},{ing:"azucar",qty:0.75,unit:"taza"},{ing:"huevos",qty:3,unit:"und"},{ing:"crema",qty:8,unit:"fl oz"},{ing:"fruta",qty:16,unit:"oz"}]},
    {id:"treslech",   name:"Tres Leches Desserts",price:30,   portions:12, packaging:2.00, recipe:[
      {ing:"harina",qty:2,unit:"taza"},{ing:"azucar",qty:1.5,unit:"taza"},{ing:"huevos",qty:6,unit:"und"},{ing:"lcond",qty:14,unit:"oz"},{ing:"levap",qty:12,unit:"oz"},{ing:"crema",qty:16,unit:"fl oz"},{ing:"vain",qty:1,unit:"cdta"}]},
    {id:"brazo",      name:"Swiss Roll / Cake",   price:20,   portions:10, packaging:1.50, recipe:[
      {ing:"harina",qty:1,unit:"taza"},{ing:"azucar",qty:1,unit:"taza"},{ing:"huevos",qty:5,unit:"und"},{ing:"vain",qty:1,unit:"cdta"},{ing:"aglass",qty:0.5,unit:"taza"}]},
    {id:"custom",     name:"Custom Cakes",        price:null, portions:12, packaging:3.00, recipe:[
      {ing:"harina",qty:3,unit:"taza"},{ing:"azucar",qty:2,unit:"taza"},{ing:"huevos",qty:6,unit:"und"},{ing:"manteq",qty:0.5,unit:"taza"},{ing:"vain",qty:2,unit:"cdta"}]}
  ]
};

/* ===== Unidades: todo se convierte a gramos para calcular el costo ===== */
const UNITS = ["und","g","oz","lb","kg","ml","cdta","cda","fl oz","taza","L","galón"];
const WEIGHT_G = {g:1, oz:28.3495, lb:453.592, kg:1000};
const VOL_ML = {ml:1, cdta:4.92892, cda:14.7868, "fl oz":29.5735, taza:236.588, L:1000, "galón":3785.41};
const unitKind = u => u==="und" ? "count" : (u in WEIGHT_G ? "weight" : "volume");
function toGrams(qty, unit, density){
  const k = unitKind(unit);
  if(k==="count") return null;
  if(k==="weight") return qty*WEIGHT_G[unit];
  return qty*VOL_ML[unit]/236.588*(density||240); /* density = gramos por taza */
}
function lineCost(l){
  const ing = ingById(l.ing);
  if(!ing) return {cost:0, ok:false};
  const ku = unitKind(ing.unit), kl = unitKind(l.unit||ing.unit);
  if(ku==="count" || kl==="count"){
    if(ing.unit!==(l.unit||ing.unit)) return {cost:0, ok:false};
    return {cost: ing.pkg>0 ? (l.qty||0)*ing.price/ing.pkg : 0, ok:true};
  }
  const dens = ing.density||240;
  const pkgG = toGrams(ing.pkg, ing.unit, dens), qtyG = toGrams(l.qty||0, l.unit||ing.unit, dens);
  if(!pkgG || !qtyG || pkgG<=0) return {cost:0, ok:false};
  return {cost: qtyG*ing.price/pkgG, ok:true, approx: ku!==kl && !ing.density};
}

/* ===== Estado ===== */
const KEY = "soth-data-v2";
let state;
function normalize(){
  if(state.marginPct==null) state.marginPct = 40;
  if(state.hourlyRate==null) state.hourlyRate = 15;
  if(state.overheadPct==null) state.overheadPct = 10;
  if(!Array.isArray(state.quotes)) state.quotes = [];
  if(state.quoteSeq==null) state.quoteSeq = 0;
  state.products.forEach(p=>{ if(p.laborHours==null) p.laborHours = 0; if(p.decor==null) p.decor = 0; });
}
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){ state = JSON.parse(raw); normalize(); return; }
  }catch(e){}
  state = JSON.parse(JSON.stringify(SEED));
  normalize();
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function resetData(){
  if(confirm("¿Restablecer todos los datos a los valores de ejemplo?")){
    localStorage.removeItem(KEY); load(); renderAll();
  }
}

/* ===== Cálculos ===== */
const ingById = id => state.ingredients.find(i=>i.id===id);
const prodById = id => state.products.find(p=>p.id===id);
const unitCost = ing => ing.pkg > 0 ? ing.price/ing.pkg : 0;
function recipeCost(p){
  return p.recipe.reduce((s,l)=> s + lineCost(l).cost, 0);
}
const laborCost = p => (p.laborHours||0)*(state.hourlyRate||0);
function costBreakdown(p){
  const r = recipeCost(p), pack = p.packaging||0, dec = p.decor||0, lab = laborCost(p);
  const sub = r+pack+dec+lab, oh = sub*(state.overheadPct||0)/100;
  return {r, pack, dec, lab, oh, total: sub+oh};
}
const totalCost = p => costBreakdown(p).total;
const suggested = p => Math.round(totalCost(p) * (1 + (state.marginPct||0)/100));
const money = n => "$"+Number(n).toFixed(2);
const money0 = n => "$"+Math.round(Number(n));
function marginBadge(p){
  if(p.price==null) return `<span class="badge info">precio a cotizar</span>`;
  const tc = totalCost(p), s = suggested(p);
  if(p.price>=s)  return `<span class="badge ok">✓ buen margen</span>`;
  if(p.price>=tc) return `<span class="badge warn">cubre costos, margen bajo</span>`;
  return `<span class="badge bad">⚠ no cubre el costo total (${money0(tc)})</span>`;
}
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const unitOpts = sel => UNITS.map(u=>`<option value="${u}" ${u===sel?"selected":""}>${u}</option>`).join("");

/* ===== Pestaña: Productos ===== */
function renderProductos(){
  const el = document.getElementById("tab-productos");
  let h = `<div class="notice">Precios reales del flyer. Los <b>costos de insumos son ejemplos</b>: actualízalos en la pestaña Insumos.</div>`;
  h += `<div class="card">
      <label class="field"><span>Ganancia deseada sobre el costo (%)</span>
      <input type="number" step="1" min="0" value="${state.marginPct}" data-edit="marginPct"></label>
      <div class="grid2">
        <label class="field"><span>Tarifa por hora (mano de obra)</span>
          <input type="number" step="0.5" min="0" value="${state.hourlyRate}" data-edit="hourlyRate"></label>
        <label class="field"><span>Gastos indirectos (%)</span>
          <input type="number" step="1" min="0" value="${state.overheadPct}" data-edit="overheadPct"></label>
      </div>
      <div class="muted">Precio sugerido = costo total (todo incluido) + tu ganancia.</div>
    </div>`;
  for(const p of state.products){
    const sug = suggested(p), b = costBreakdown(p);
    const perSlice = p.price!=null ? p.price/p.portions : sug/p.portions;
    h += `<div class="card" data-product="${p.id}">
      <h3>${esc(p.name)}</h3>
      <div class="grid2">
        <label class="field"><span>Precio entero (USD)</span>
          <input type="number" step="0.5" min="0" placeholder="a cotizar" value="${p.price??""}" data-pf="price"></label>
        <label class="field"><span>Porciones</span>
          <input type="number" step="1" min="1" value="${p.portions}" data-pf="portions"></label>
        <label class="field"><span>Empaque (USD)</span>
          <input type="number" step="0.1" min="0" value="${p.packaging||0}" data-pf="packaging"></label>
        <label class="field"><span>Decoración (USD)</span>
          <input type="number" step="0.1" min="0" value="${p.decor||0}" data-pf="decor"></label>
      </div>
      <label class="field" style="margin-top:8px"><span>Mano de obra (horas)</span>
        <input type="number" step="0.25" min="0" value="${p.laborHours||0}" data-pf="laborHours"></label>
      <hr class="sep">
      <div class="kv"><span>Insumos (receta)</span><strong>${money(b.r)}</strong></div>
      <div class="kv"><span>Mano de obra (${p.laborHours||0} h × ${money(state.hourlyRate)})</span><strong>${money(b.lab)}</strong></div>
      <div class="kv"><span>Empaque + decoración + indirectos (${state.overheadPct}%)</span><strong>${money(b.pack+b.dec+b.oh)}</strong></div>
      <div class="cost-total"><span>COSTO TOTAL</span><span class="big">${money(b.total)}</span></div>
      <div class="kv"><span>Precio sugerido (costo + ${state.marginPct}% de ganancia)</span><strong>${money0(sug)}</strong></div>
      <div class="kv"><span>Precio por porción</span><strong>${money(perSlice)}</strong></div>
      <div style="margin-top:6px">${marginBadge(p)}</div>
    </div>`;
  }
  el.innerHTML = h;
}

/* ===== Pestaña: Recetas ===== */
let recetaSel = null;
function renderRecetas(){
  const el = document.getElementById("tab-recetas");
  if(!recetaSel || !prodById(recetaSel)) recetaSel = state.products[0].id;
  const p = prodById(recetaSel);
  const ingOpts = sel => state.ingredients.map(i=>
    `<option value="${i.id}" ${i.id===sel?"selected":""}>${esc(i.name)} (${money(unitCost(i))}/${i.unit})</option>`).join("");
  let rows = p.recipe.map((l,idx)=>{
    const ing = ingById(l.ing);
    const lu = l.unit || (ing?ing.unit:"und");
    const r = lineCost(l);
    const costCell = !r.ok ? `<span title="Unidades incompatibles">⚠</span>`
      : (r.approx ? "≈"+money(r.cost) : money(r.cost));
    return `<tr><td>${ing?esc(ing.name):"—"}</td>
      <td class="num"><input type="number" step="0.1" min="0" value="${l.qty}" data-rl="${idx}" style="width:64px"></td>
      <td><select data-rlu="${idx}" style="padding:8px 4px">${unitOpts(lu)}</select></td>
      <td class="num">${costCell}</td>
      <td><button class="danger small" data-rdel="${idx}">✕</button></td></tr>`;
  }).join("");
  el.innerHTML = `
    <div class="card">
      <label class="field"><span>Producto</span>
        <select id="receta-producto">${state.products.map(x=>
          `<option value="${x.id}" ${x.id===p.id?"selected":""}>${esc(x.name)}</option>`).join("")}</select></label>
    </div>
    <div class="card">
      <h3>Ingredientes <span class="muted">· cantidades de ejemplo</span></h3>
      <table class="lines"><tr><th>Insumo</th><th class="num">Cant.</th><th>Ud.</th><th class="num">Costo</th><th></th></tr>${rows}</table>
      <div class="muted" style="margin:6px 0 0">≈ = conversión aproximada entre peso y volumen</div>
      <div class="kv" style="margin-top:8px"><span><b>Costo total receta</b></span><strong class="big">${money(recipeCost(p))}</strong></div>
      <hr class="sep">
      <div class="row">
        <select id="nuevo-ing" style="flex:2">${ingOpts()}</select>
        <input id="nuevo-qty" type="number" step="0.1" min="0" placeholder="Cant." style="flex:1">
        <select id="nuevo-unit" style="flex:1">${unitOpts("taza")}</select>
        <button id="add-linea">Añadir</button>
      </div>
    </div>`;
}

/* ===== Pestaña: Insumos ===== */
function renderInsumos(){
  const el = document.getElementById("tab-insumos");
  let h = `<div class="notice">⚠️ <b>Precios de ejemplo.</b> Reemplázalos con lo que realmente pagan. Todo se guarda en este dispositivo.<br>
    Pon el <b>tamaño tal como sale en la etiqueta</b> (5 lb, 12 und, 1 galón). En la receta pones lo que usas (2 tazas) y la app convierte sola.</div>`;
  for(const ing of state.ingredients){
    h += `<div class="card" data-ing="${ing.id}">
      <div class="row">
        <label class="field" style="flex:2;min-width:140px"><span>Insumo</span>
          <input value="${esc(ing.name)}" data-if="name"></label>
        <button class="danger small" data-idel="${ing.id}">✕</button>
      </div>
      <div class="grid2" style="margin-top:8px">
        <label class="field"><span>Precio compra (USD)</span>
          <input type="number" step="0.01" min="0" value="${ing.price}" data-if="price"></label>
        <label class="field"><span>Cantidad del envase</span>
          <input type="number" step="0.01" min="0" value="${ing.pkg}" data-if="pkg"></label>
      </div>
      <label class="field" style="margin-top:8px"><span>Unidad <span class="muted" style="font-weight:400">· como sale en la etiqueta</span></span>
        <select data-if="unit">${unitOpts(ing.unit)}</select></label>
      <div class="muted" style="margin-top:6px">Costo: <b>${money(unitCost(ing))}/${esc(ing.unit)}</b></div>
    </div>`;
  }
  h += `<div class="card"><h3>Añadir insumo</h3>
    <div class="grid2">
      <label class="field"><span>Nombre</span><input id="ni-name" placeholder="Ej: Cocoa"></label>
      <label class="field"><span>Unidad (etiqueta)</span><select id="ni-unit">${unitOpts("und")}</select></label>
      <label class="field"><span>Precio compra (USD)</span><input id="ni-price" type="number" step="0.01" min="0"></label>
      <label class="field"><span>Cantidad del envase</span><input id="ni-pkg" type="number" step="0.01" min="0"></label>
    </div>
    <div class="row" style="margin-top:10px">
      <button id="ni-add">Añadir insumo</button>
      <button class="ghost" id="ni-reset">Restablecer ejemplos</button>
    </div></div>`;
  el.innerHTML = h;
}

/* ===== Pestaña: Cotizar ===== */
function discountFor(people){
  if(people>=100) return 15;
  if(people>=50)  return 10;
  if(people>=30)  return 5;
  return 0;
}
let draft = null;
function newDraft(){
  return {type:"individual", clientName:"", clientPhone:"", notes:"",
    items:[], evProductId:null, people:30, perPerson:1, pps:null, delivery:0};
}
function evProduct(){ return prodById(draft.evProductId) || state.products[0]; }
function evNumbers(){
  const p = evProduct();
  const base = p.price!=null ? p.price/p.portions : suggested(p)/p.portions;
  const servings = draft.people*draft.perPerson;
  const pps = draft.pps!=null ? draft.pps : Math.round(base*100)/100;
  const subtotal = servings*pps;
  const disc = discountFor(draft.people);
  const total = subtotal - subtotal*disc/100 + draft.delivery;
  return {p, servings, pps, subtotal, disc, total};
}
function draftTotal(){
  if(draft.type==="evento") return evNumbers().total;
  return draft.items.reduce((s,it)=> s + it.qty*it.price, 0);
}
function snapshotDraft(){
  const q = { id: Date.now(), seq: (state.quoteSeq||0)+1, date: Date.now(),
    type: draft.type,
    client: {name: draft.clientName.trim(), phone: draft.clientPhone.trim()},
    notes: draft.notes.trim(), total: draftTotal() };
  if(draft.type==="individual"){
    q.items = draft.items.map(it=>({name: it.name, qty: it.qty, price: it.price, total: it.qty*it.price}));
  } else {
    const n = evNumbers();
    q.event = {name: n.p.name, people: draft.people, perPerson: draft.perPerson,
      servings: n.servings, pps: n.pps, subtotal: n.subtotal, disc: n.disc, delivery: draft.delivery};
  }
  return q;
}
function quoteText(q){
  let lines = [`Cotización #${q.seq} — Sweets of the Heart 🧁`];
  if(q.client.name) lines.push(`Cliente: ${q.client.name}`);
  if(q.type==="individual"){
    q.items.forEach(it=> lines.push(`• ${it.name} × ${it.qty} — ${money(it.total)}`));
  } else {
    const e = q.event;
    lines.push(`Producto: ${e.name}`);
    lines.push(`Personas: ${e.people} (${e.perPerson} porción c/u = ${e.servings} porciones)`);
    lines.push(`Precio por porción: ${money(e.pps)}`);
    lines.push(`Subtotal: ${money(e.subtotal)}`);
    lines.push(`Descuento por volumen (${e.disc}%): −${money(e.subtotal*e.disc/100)}`);
    lines.push(`Delivery: ${money(e.delivery)}`);
  }
  if(q.notes) lines.push(`Notas: ${q.notes}`);
  lines.push(`TOTAL: ${money(q.total)}`);
  lines.push(`Cotización válida por 7 días.`);
  return lines.join("\n");
}
async function copyText(txt){
  try{ await navigator.clipboard.writeText(txt); alert("Copiada ✓ Lista para pegar en WhatsApp"); }
  catch(e){ alert(txt); }
}
/* ===== PDF: archivo real generado en el dispositivo (sin imprimir) ===== */
function pdfEscape(s){
  return String(s).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
}
function toPdfBytes(str){
  const bytes = [];
  for(const ch of String(str)){
    const cp = ch.codePointAt(0);
    if(cp < 128) bytes.push(cp);
    else if(cp >= 0xA0 && cp <= 0xFF) bytes.push(cp);
    else if(cp === 0x2022) bytes.push(0x95);
    else if(cp === 0x2013) bytes.push(0x96);
    else if(cp === 0x2014) bytes.push(0x97);
    else if(cp === 0x201C) bytes.push(0x93);
    else if(cp === 0x201D) bytes.push(0x94);
    else if(cp === 0x2019) bytes.push(0x92);
    else bytes.push(0x3F);
  }
  return new Uint8Array(bytes);
}
function concatBytes(arrs){
  const len = arrs.reduce((s,a)=> s + a.length, 0);
  const out = new Uint8Array(len); let o = 0;
  arrs.forEach(a=>{ out.set(a,o); o += a.length; });
  return out;
}
function makeQuotePDF(q){
  const d = new Date(q.date).toLocaleDateString("es-US",{year:"numeric",month:"long",day:"numeric"});
  const L = [];
  const push = (t,x,y,f,s)=> L.push({t,x,y,f:f||"F1",s:s||11});
  push("Sweets of the Heart",48,744,"F2",20);
  push("Pastelería casera · South Jordan, UT · WhatsApp +1 801-680-6443",48,726,"F1",10);
  push("Cotización #"+q.seq,48,698,"F2",15);
  push("Fecha: "+d,48,680);
  push("Cliente: "+(q.client.name||"-")+(q.client.phone? " · "+q.client.phone:""),48,664);
  let y = 630;
  if(q.type==="individual"){
    push("Producto",48,y,"F2",11); push("Cant.",330,y,"F2",11);
    push("Precio",400,y,"F2",11); push("Total",480,y,"F2",11);
    q.items.forEach(it=>{
      y -= 16;
      push(it.name,48,y); push(String(it.qty),330,y);
      push(money(it.price),400,y); push(money(it.total),480,y);
    });
  } else {
    const e = q.event;
    const rows = [
      ["Producto", e.name],
      ["Personas", e.people+" ("+e.perPerson+" porción c/u = "+e.servings+" porciones)"],
      ["Precio por porción", money(e.pps)],
      ["Subtotal", money(e.subtotal)],
      ["Descuento por volumen ("+e.disc+"%)", "-"+money(e.subtotal*e.disc/100)],
      ["Delivery", money(e.delivery)]
    ];
    rows.forEach(([k,v])=>{ push(k,48,y); push(v,330,y); y -= 16; });
    y += 16;
  }
  if(q.notes){ y -= 8; push("Notas: "+q.notes,48,y); }
  push("TOTAL: "+money(q.total),400,y-34,"F2",15);
  push("Cotización válida por 7 días. ¡Gracias por tu pedido!",48,72,"F1",10);

  let content = "0.7 w 48 648 m 564 648 l S\n";
  L.forEach(o=>{ content += "BT /"+o.f+" "+o.s+" Tf 1 0 0 1 "+o.x+" "+o.y+" Tm ("+pdfEscape(o.t)+") Tj ET\n"; });
  const streamBytes = toPdfBytes(content);
  const objStrs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
  ];
  const chunks = [], offsets = [];
  let pos = 0;
  const add = u8 => { chunks.push(u8); pos += u8.length; };
  add(toPdfBytes("%PDF-1.4\n"));
  objStrs.forEach((s,i)=>{ offsets.push(pos); add(toPdfBytes((i+1)+" 0 obj\n"+s+"\nendobj\n")); });
  offsets.push(pos);
  add(concatBytes([toPdfBytes("6 0 obj\n<< /Length "+streamBytes.length+" >>\nstream\n"),
    streamBytes, toPdfBytes("\nendstream\nendobj\n")]));
  const xrefPos = pos;
  let xref = "xref\n0 7\n0000000000 65535 f \n";
  offsets.forEach(o=>{ xref += String(o).padStart(10,"0")+" 00000 n \n"; });
  xref += "trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n"+xrefPos+"\n%%EOF";
  add(toPdfBytes(xref));
  return new Blob([concatBytes(chunks)], {type:"application/pdf"});
}
function sharePDF(q){
  const blob = makeQuotePDF(q);
  const name = "cotizacion-"+q.seq+"-sweets-of-the-heart.pdf";
  const file = new File([blob], name, {type:"application/pdf"});
  if(navigator.canShare && navigator.canShare({files:[file]})){
    navigator.share({files:[file], title:"Cotización #"+q.seq}).catch(()=>{});
    return;
  }
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 4000);
}
function renderCotizar(){
  const el = document.getElementById("tab-cotizar");
  if(!draft) draft = newDraft();
  const ep = evProduct();
  if(!draft.evProductId) draft.evProductId = ep.id;
  const n = evNumbers();
  let form = "";
  if(draft.type==="individual"){
    const rows = draft.items.map((it,idx)=>`<tr>
      <td>${esc(it.name)}</td>
      <td class="num"><input type="number" step="1" min="0" value="${it.qty}" data-diq="${idx}" style="width:60px"></td>
      <td class="num"><input type="number" step="0.5" min="0" value="${it.price}" data-dip="${idx}" style="width:76px"></td>
      <td class="num">${money(it.qty*it.price)}</td>
      <td><button class="danger small" data-didel="${idx}">✕</button></td></tr>`).join("");
    form = `<table class="lines"><tr><th>Producto</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Total</th><th></th></tr>${rows}</table>
      <div class="row" style="margin-top:10px">
        <select id="d-add-product" style="flex:2">${state.products.map(x=>
          `<option value="${x.id}">${esc(x.name)}${x.price!=null?" — "+money0(x.price):""}</option>`).join("")}</select>
        <button id="d-add-item">Añadir</button>
      </div>`;
  } else {
    form = `<label class="field"><span>Producto</span>
        <select id="d-ev-product">${state.products.map(x=>
          `<option value="${x.id}" ${x.id===ep.id?"selected":""}>${esc(x.name)}${x.price!=null?" — "+money0(x.price):""}</option>`).join("")}</select></label>
      <div class="grid2">
        <label class="field"><span>Personas</span>
          <input id="d-ev-people" type="number" step="1" min="1" value="${draft.people}"></label>
        <label class="field"><span>Porciones por persona</span>
          <input id="d-ev-per" type="number" step="0.5" min="0.5" value="${draft.perPerson}"></label>
        <label class="field"><span>Precio por porción (USD)</span>
          <input id="d-ev-pps" type="number" step="0.05" min="0" value="${n.pps}"></label>
        <label class="field"><span>Delivery (USD)</span>
          <input id="d-ev-delivery" type="number" step="0.5" min="0" value="${draft.delivery}"></label>
      </div>
      <div class="muted">Total porciones: <b>${n.servings}</b> · Descuento por volumen: 30–49 → 5% · 50–99 → 10% · 100+ → 15%</div>
      <hr class="sep">
      <div class="kv"><span>Subtotal</span><strong>${money(n.subtotal)}</strong></div>
      <div class="kv"><span>Descuento (${n.disc}%)</span><strong>−${money(n.subtotal*n.disc/100)}</strong></div>
      <div class="kv"><span>Delivery</span><strong>${money(draft.delivery)}</strong></div>`;
  }
  const hist = state.quotes.map(q=>`
    <div class="kv"><span>#${q.seq} · ${esc(q.client.name||"Sin nombre")} · ${q.type==="evento"?"Evento":"Individual"} · ${new Date(q.date).toLocaleDateString("es-US")}</span><strong>${money(q.total)}</strong></div>
    <div class="row" style="margin-bottom:8px">
      <button class="ghost small" data-qpdf="${q.id}">PDF</button>
      <button class="ghost small" data-qwa="${q.id}">WhatsApp</button>
      <button class="danger small" data-qdel="${q.id}">Eliminar</button>
    </div>`).join("");
  el.innerHTML = `
    <div class="card">
      <h3>Nueva cotización</h3>
      <label class="field"><span>Tipo</span>
        <select id="d-type">
          <option value="individual" ${draft.type==="individual"?"selected":""}>Individual (productos × cantidad)</option>
          <option value="evento" ${draft.type==="evento"?"selected":""}>Evento / catering (por persona)</option>
        </select></label>
      <div class="grid2">
        <label class="field"><span>Cliente</span>
          <input id="d-client" placeholder="Nombre" value="${esc(draft.clientName)}"></label>
        <label class="field"><span>Teléfono</span>
          <input id="d-phone" placeholder="Opcional" value="${esc(draft.clientPhone)}"></label>
      </div>
      ${form}
      <label class="field" style="margin-top:10px"><span>Notas</span>
        <input id="d-notes" placeholder="Fecha, sabores, entrega…" value="${esc(draft.notes)}"></label>
      <div class="total-row"><span><b>TOTAL</b></span><span class="big">${money(draftTotal())}</span></div>
      <div class="row" style="margin-top:10px">
        <button id="d-save" style="flex:1">Guardar</button>
        <button id="d-pdf" class="ghost" style="flex:1">PDF</button>
        <button id="d-wa" class="ghost" style="flex:1">WhatsApp</button>
      </div>
    </div>
    <div class="card">
      <h3>Cotizaciones guardadas</h3>
      ${hist || '<div class="muted">Todavía no hay cotizaciones guardadas.</div>'}
    </div>`;
}

/* ===== Render general + eventos ===== */
function renderAll(){ renderProductos(); renderRecetas(); renderInsumos(); renderCotizar(); }

document.querySelectorAll("nav#tabs button").forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll("nav#tabs button").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    document.querySelectorAll("section.tab").forEach(s=>s.classList.remove("active"));
    document.getElementById("tab-"+b.dataset.tab).classList.add("active");
    window.scrollTo(0,0);
  };
});

document.addEventListener("change", e=>{
  const t = e.target;
  if(t.dataset.edit){
    const v = parseFloat(t.value);
    if(t.dataset.edit==="marginPct") state.marginPct = isNaN(v)?0:v;
    if(t.dataset.edit==="hourlyRate") state.hourlyRate = isNaN(v)?0:v;
    if(t.dataset.edit==="overheadPct") state.overheadPct = isNaN(v)?0:v;
    save(); renderAll(); return;
  }
  const pc = t.closest("[data-product]");
  if(pc && t.dataset.pf){
    const p = prodById(pc.dataset.product); const f = t.dataset.pf;
    let v = t.value==="" ? null : parseFloat(t.value);
    if(f==="price") p.price = (v==null||isNaN(v)) ? null : v;
    if(f==="portions") p.portions = Math.max(1, Math.round(v)||1);
    if(f==="packaging") p.packaging = isNaN(v)?0:v;
    if(f==="decor") p.decor = isNaN(v)?0:v;
    if(f==="laborHours") p.laborHours = isNaN(v)?0:v;
    save(); renderAll(); return;
  }
  const ic = t.closest("[data-ing]");
  if(ic && t.dataset.if){
    const ing = ingById(ic.dataset.ing); const f = t.dataset.if;
    if(f==="name"||f==="unit") ing[f]=t.value;
    else ing[f]=parseFloat(t.value)||0;
    save(); renderAll(); return;
  }
  if(t.id==="receta-producto"){ recetaSel=t.value; renderRecetas(); return; }
  if(t.dataset.rlu!==undefined){
    prodById(recetaSel).recipe[+t.dataset.rlu].unit = t.value;
    save(); renderRecetas(); renderProductos(); return;
  }
  if(t.id==="d-type"){ draft.type=t.value; renderCotizar(); return; }
  if(t.id==="d-client"){ draft.clientName=t.value; return; }
  if(t.id==="d-phone"){ draft.clientPhone=t.value; return; }
  if(t.id==="d-notes"){ draft.notes=t.value; return; }
  if(t.dataset.diq!==undefined){ draft.items[+t.dataset.diq].qty=parseFloat(t.value)||0; renderCotizar(); return; }
  if(t.dataset.dip!==undefined){ draft.items[+t.dataset.dip].price=parseFloat(t.value)||0; renderCotizar(); return; }
  if(t.id==="d-ev-product"){ draft.evProductId=t.value; draft.pps=null; renderCotizar(); return; }
  if(t.id==="d-ev-people"){ draft.people=Math.max(1,Math.round(parseFloat(t.value)||1)); renderCotizar(); return; }
  if(t.id==="d-ev-per"){ draft.perPerson=parseFloat(t.value)||1; renderCotizar(); return; }
  if(t.id==="d-ev-pps"){ draft.pps=parseFloat(t.value)||0; renderCotizar(); return; }
  if(t.id==="d-ev-delivery"){ draft.delivery=parseFloat(t.value)||0; renderCotizar(); return; }
  if(t.dataset.rl!==undefined){
    const p = prodById(recetaSel);
    p.recipe[+t.dataset.rl].qty = parseFloat(t.value)||0;
    save(); renderRecetas(); renderProductos(); return;
  }
});

document.addEventListener("click", e=>{
  const t = e.target;
  if(t.id==="add-linea"){
    const p = prodById(recetaSel);
    const ingId = document.getElementById("nuevo-ing").value;
    const qty = parseFloat(document.getElementById("nuevo-qty").value)||0;
    const unit = document.getElementById("nuevo-unit").value;
    if(ingId && qty>0){ p.recipe.push({ing:ingId, qty, unit}); save(); renderRecetas(); renderProductos(); }
    return;
  }
  if(t.dataset.rdel!==undefined){
    const p = prodById(recetaSel);
    p.recipe.splice(+t.dataset.rdel,1); save(); renderRecetas(); renderProductos(); return;
  }
  if(t.dataset.idel){
    const id = t.dataset.idel;
    if(confirm("¿Eliminar este insumo? Se quitará también de las recetas.")){
      state.ingredients = state.ingredients.filter(i=>i.id!==id);
      state.products.forEach(p=>p.recipe=p.recipe.filter(l=>l.ing!==id));
      save(); renderAll();
    }
    return;
  }
  if(t.id==="ni-add"){
    const name=document.getElementById("ni-name").value.trim();
    const unit=document.getElementById("ni-unit").value;
    const price=parseFloat(document.getElementById("ni-price").value)||0;
    const pkg=parseFloat(document.getElementById("ni-pkg").value)||0;
    if(!name||pkg<=0){ alert("Nombre y cantidad del envase son obligatorios."); return; }
    state.ingredients.push({id:"ing-"+Date.now(), name, price, pkg, unit});
    save(); renderAll(); return;
  }
  if(t.id==="d-add-item"){
    const sel = document.getElementById("d-add-product");
    const p = prodById(sel.value);
    if(p){ draft.items.push({productId:p.id, name:p.name, qty:1, price: p.price!=null? p.price : suggested(p)}); renderCotizar(); }
    return;
  }
  if(t.dataset.didel!==undefined){ draft.items.splice(+t.dataset.didel,1); renderCotizar(); return; }
  if(t.id==="d-save"){
    const q = snapshotDraft();
    state.quoteSeq = q.seq; state.quotes.unshift(q); save();
    draft = newDraft(); renderCotizar();
    alert("Cotización #"+q.seq+" guardada ✓"); return;
  }
  if(t.id==="d-pdf"){ sharePDF(snapshotDraft()); return; }
  if(t.id==="d-wa"){ copyText(quoteText(snapshotDraft())); return; }
  if(t.dataset.qpdf){ const q = state.quotes.find(x=>x.id==t.dataset.qpdf); if(q) sharePDF(q); return; }
  if(t.dataset.qwa){ const q = state.quotes.find(x=>x.id==t.dataset.qwa); if(q) copyText(quoteText(q)); return; }
  if(t.dataset.qdel){
    if(confirm("¿Eliminar esta cotización?")){
      state.quotes = state.quotes.filter(x=>x.id!=t.dataset.qdel);
      save(); renderCotizar();
    }
    return;
  }
  if(t.id==="ni-reset"){ resetData(); return; }
});

/* ===== Init ===== */
const verEl = document.getElementById("app-version");
if(verEl) verEl.textContent = "v"+APP_VERSION;
load();
renderAll();
if("serviceWorker" in navigator){ navigator.serviceWorker.register("sw.js").catch(()=>{}); }

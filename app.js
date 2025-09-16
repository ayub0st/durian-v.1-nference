// app.js

// === Utilities (escape + chip link + query) ===
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function chipLink(label, href){
  const safeHref = href.replace(/"/g,'%22');
  return `<span class="chip"><a href="${safeHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></span>`;
}
function googleLabelQuery(active){
  return `https://www.google.com/search?q=${encodeURIComponent(`${active} ฉลาก การใช้พืช อ่านฉลาก`)}`;
}
function googleSafetyQuery(active){
  return `https://www.google.com/search?q=${encodeURIComponent(`${active} safety data sheet MSDS label`)}`;
}

// === Normalization helper (จากรอบก่อน) ===
function normKey(s=""){ return s.trim().replace(/\s+/g,' ').replace(/_/g,' ').toUpperCase(); }
function byRef(k){ return null; } // <-- ใส่ ADVICE_MAP ของคุณตรงนี้

// === Render Summary ===
function renderSummary(resp){
  const listDiv = $('#summary');
  const cardsDiv = $('#top3cards');

  if (Array.isArray(resp?.predictions) && resp.predictions.length){
    const list = resp.predictions.map(x => ({
      cls: x.class || x.label || 'Unknown',
      conf: Number(x.confidence || x.score || 0),
      box: { x:x.x, y:x.y, w:x.width, h:x.height }
    })).sort((a,b)=> b.conf - a.conf);

    const top3 = list.slice(0,3);

    const cardHtml = top3.map((it, idx) => `
      <div class="topcard">
        <span class="badge t${idx+1}">Top ${idx+1}</span>
        <div class="name">${escapeHtml(it.cls)}</div>
        <div class="pct">${(it.conf*100).toFixed(1)}%</div>
      </div>
    `).join('');
    cardsDiv.removeClass('hidden').html(cardHtml);

    listDiv.html('<ol>' + top3.map(i =>
      `<li><b>${escapeHtml(i.cls)}</b> — ${(i.conf*100).toFixed(1)}%</li>`
    ).join('') + '</ol>');

    if (top3[0] && top3[0].box) drawTopBox(top3[0]); else clearBoxes();
  } else {
    cardsDiv.addClass('hidden').empty();
    listDiv.html('<em>ยังไม่มีผลลัพธ์</em>');
    clearBoxes();
  }
}

// === Render Advice ===
function renderAdvice(resp){
  let items = [];
  if (Array.isArray(resp?.predictions) && resp.predictions.length){
    const list = resp.predictions.map(x => ({
      cls: String(x.class || x.label || ''),
      conf: Number(x.confidence || x.score || 0)
    })).sort((a,b)=> b.conf - a.conf).slice(0,3);
    items = list.map(l => ({ cls: l.cls, conf: l.conf }));
  }

  const results = [];
  const seen = new Set();
  for (const it of items){
    const key = normKey(it.cls);
    if (seen.has(key)) continue;
    seen.add(key);
    const adv = byRef(key);
    if (!adv) continue;
    results.push({
      title: it.conf != null ? `${it.cls} — ${(it.conf*100).toFixed(1)}%` : it.cls,
      tips: adv.tips || [],
      actives: adv.actives || [],
      fertilizer: adv.fertilizer || []
    });
  }

  const tipsEl = $('#advice-tips'), actEl = $('#advice-actives'), fertEl = $('#advice-fert');

  if (!results.length){
    tipsEl.html('<em>ยังไม่มีคำแนะนำ</em>');
    actEl.html('<em>ยังไม่มีรายการตัวยา</em>');
    fertEl.html('<em>ยังไม่มีรายการปุ๋ย</em>');
    return;
  }

  tipsEl.html(results.map(r => `
    <div class="advice-block">
      <div class="advice-title">${escapeHtml(r.title)}</div>
      <ul class="advice-list">${r.tips.map(t=>`<li>${escapeHtml(t)}</li>`).join('')}</ul>
    </div>`).join(''));

  actEl.html(results.map(r => `
    <div class="advice-block">
      <div class="advice-title">${escapeHtml(r.title)}</div>
      <div class="kv">${r.actives.map(ac=>`<span class="pill">${escapeHtml(ac)}</span>`).join('')}</div>
      <div class="chips">${r.actives.map(ac=>chipLink(`อ่านฉลาก: ${ac}`, googleLabelQuery(ac))).join('')}
      ${r.actives.map(ac=>chipLink(`ข้อมูลสาร: ${ac}`, googleSafetyQuery(ac))).join('')}</div>
    </div>`).join(''));

  fertEl.html(results.map(r => `
    <div class="advice-block">
      <div class="advice-title">${escapeHtml(r.title)}</div>
      <div class="kv">${r.fertilizer.map(f=>`<span class="pill">${escapeHtml(f)}</span>`).join('')}</div>
    </div>`).join(''));
}

// === Tab Switching ===
$(document).on('click', '.tab', function(){
  $('.tab').removeClass('active');
  $(this).addClass('active');
  const which = $(this).data('tab');
  $('#advice-tips').toggleClass('hidden', which!=='tips');
  $('#advice-actives').toggleClass('hidden', which!=='actives');
  $('#advice-fert').toggleClass('hidden', which!=='fert');
});

// === Clear All ===
function clearAll(){
  $('#file').val(''); $('#url').val('');
  $('#preview').addClass('hidden').find('img').attr('src','');
  $('#summary').html('<em>ยังไม่มีผลลัพธ์</em>');
  $('#top3cards').addClass('hidden').empty();
  $('#advice').html('<em>ยังไม่มีคำแนะนำ</em>');
  $('#output').text('รอผลลัพธ์…');
  $('#status').text('พร้อมทำงาน');
  clearBoxes();
}

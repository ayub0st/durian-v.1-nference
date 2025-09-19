// ===== CONFIG =====
const ROBOFLOW_MODEL = "durian-leaf-hpx1m"; // หากเปลี่ยนไปใช้ Object Detection Model ให้เปลี่ยนชื่อตรงนี้
const ROBOFLOW_VERSION = "1";
const ROBOFLOW_API_KEY = "qUdNbcOApV2SReomWRn7";

// 1) Leaf Gate (ตรวจว่ารูปเป็นใบพืช/ใบทุเรียนก่อน)
const LEAF_SEG_MODEL = "leaf-segmentation-xwbm5";
const LEAF_SEG_VERSION = "3";

// ===== Advice Map (เด่นขึ้น + ลิงก์อ่านฉลาก/ข้อมูลกลาง) =====
const ADVICE_MAP = {
  ALGAL_LEAF_SPOT: {
    tips: [
      "ตัดใบที่เป็นโรคออกและเผาทำลาย",
      "พ่นสารทองแดง (Copper) ตามฉลาก",
      "ลดความชื้นในแปลง",
    ],
    actives: ["Copper (ทองแดง)"],
    fertilizer: ["โพแทสเซียม (K)", "แคลเซียม-ซิลิกา"],
  },
  "ALGAL-LEAF-SPOT": { ref: "ALGAL_LEAF_SPOT" },
  ALLOCARIDARA_ATTACK: {
    tips: [
      "ใช้กับดักกาวเหนียวสีเหลือง",
      "พ่นน้ำส้มควันไม้หรือน้ำสบู่อ่อน",
      "เชื้อรา Beauveria bassiana หรือสารกลุ่ม Neonicotinoid (อ่านฉลากก่อนใช้)",
    ],
    actives: [
      "Beauveria bassiana",
      "Imidacloprid (ตรวจฉลาก/ข้อบังคับท้องถิ่น)",
    ],
    fertilizer: ["ฟอสฟอรัส (P)", "โพแทสเซียม (K)", "แมกนีเซียม (Mg)"],
  },
  HEALTHY_LEAF: {
    tips: ["ดูแลความชื้นให้เหมาะสม", "ใส่ปุ๋ยสม่ำเสมอ", "เฝ้าระวังโรคและแมลง"],
    actives: [],
    fertilizer: ["สูตรเสมอ 15-15-15", "เสริม B, Zn, Mg"],
  },
  LEAF_BLIGHT: {
    tips: [
      "กำจัดใบเป็นโรคและเผาทำลาย",
      "ตัดแต่งกิ่งให้โปร่ง ลดความชื้น",
      "พ่นสารป้องกันเชื้อรา ตามฉลาก",
    ],
    actives: ["Mancozeb", "Chlorothalonil", "Copper"],
    fertilizer: ["NPK 13-13-21", "อินทรีย์ผสมฮิวมิคแอซิด"],
  },
  "LEAF-BLIGHT": { ref: "LEAF_BLIGHT" },
  LEAF_SPOT: {
    tips: [
      "เก็บใบที่ร่วงและเผาทำลาย",
      "พ่นสารทองแดง/Mancozeb ตามฉลาก",
      "ควบคุมความชื้นในสวน",
    ],
    actives: ["Copper", "Mancozeb"],
    fertilizer: ["โพแทสเซียมสูง (K)", "Zn, Mn, B"],
  },
  "LEAF-SPOT": { ref: "LEAF_SPOT" },
  "NO DISEASE": {
    tips: ["ดูแลน้ำ-ปุ๋ยให้สมดุล", "ตรวจสอบใบอย่างสม่ำเสมอ"],
    actives: [],
    fertilizer: [
      "25-7-7 หรือ 16-16-16 (ระยะใบอ่อน)",
      "12-24-12 (เตรียมออกดอก)",
    ],
  },
  NO_DISEASE: { ref: "NO DISEASE" },
  "NO DISEASE ": { ref: "NO DISEASE" },
  PHOMOPSIS_LEAF_SPOT: {
    tips: [
      "ตัดแต่งกิ่งให้โปร่งแสง",
      "เก็บใบ/เศษใบเป็นโรคไปทำลาย",
      "พ่นสารป้องกันเชื้อรา ตามฉลาก",
    ],
    actives: ["Carbendazim", "Thiophanate-methyl"],
    fertilizer: [
      "โพแทสเซียมสูง (K)",
      "แคลเซียม-โบรอน (Ca-B)",
      "ปุ๋ยอินทรีย์เสริม",
    ],
  },
};

// ===== Utils =====
const normKey = (s = "") =>
  s.trim().replace(/\s+/g, " ").replace(/_/g, " ").toUpperCase();
const byRef = (k) => {
  const K = normKey(k);
  const entry =
    ADVICE_MAP[K] ||
    ADVICE_MAP[K.replace(/-/g, "_")] ||
    ADVICE_MAP[K.replace(/ /g, "_")];
  if (!entry) return null;
  if (entry.ref) return ADVICE_MAP[entry.ref] || null;
  return entry;
};

// ===== DOM Ready =====
$(function () {
  // Tabs
  if ($("#advice").length) {
    $(".tabs .tab").on("click", function () {
      $(".tabs .tab").removeClass("active");
      $(this).addClass("active");
      $("#advice-tips, #advice-actives, #advice-fert").addClass("hidden");
      const tab = $(this).data("tab");
      $(`#advice-${tab}`).removeClass("hidden");
    });
  }

  $("#status").text("พร้อมทำงาน");
  $("#pickFile").on("click", (e) => {
    e.preventDefault();
    $("#file").click();
  });
  $("#file").on("change", handleFile);
  $("#runBtn").on("click", run);
  $("#resetBtn").on("click", resetAll);
  $("#copyBtn").on("click", copyJson);
  initDrop();
});

// ===== Dropzone =====
function initDrop() {
  const dz = document.getElementById("dropzone");
  ["dragenter", "dragover", "dragleave", "drop"].forEach((ev) =>
    dz.addEventListener(ev, (e) => {
      e.preventDefault();
      e.stopPropagation();
    })
  );
  dz.addEventListener("dragover", () => dz.classList.add("hover"));
  dz.addEventListener("dragleave", () => dz.classList.remove("hover"));
  dz.addEventListener("drop", (e) => {
    dz.classList.remove("hover");
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readAndPreview(file);
      $("#file")[0].files = e.dataTransfer.files;
    }
  });
}

function handleFile(e) {
  const f = e.target.files?.[0];
  if (!f) return;
  readAndPreview(f);
}

function readAndPreview(file) {
  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
    img.onload = () => {
      $("#preview").removeClass("hidden").find("img").attr("src", fr.result);
    };
    img.src = fr.result;
  };
  fr.readAsDataURL(file);
}

// ===== Core pipeline =====
async function run() {
  try {
    setAlert();
    $("#status").text("กำลังประมวลผล…");
    $("#output").text("Inferring…");

    const imageUrl = $("#url").val().trim();
    let base64 = "";

    if (!imageUrl) {
      const f = $("#file")[0].files?.[0];
      if (!f) {
        alert("กรุณาเลือกรูปภาพหรือใส่ URL");
        return;
      }
      const raw = await readAsDataURL(f);
      base64 = await resizeBase64(raw);
    }

    const gate = await leafGate({ imageUrl, base64 });
    if (!gate.ok) {
      setAlert(
        "ไม่ใช่ภาพใบทุเรียนหรือใบพืชที่ตรวจจับได้ กรุณาอัปโหลดใหม่อีกครั้ง",
        "error"
      );
      $("#status").text("ไม่ผ่านการตรวจขั้นต้น");
      if ($("#summary").length)
        $("#summary").html("<em>ยกเลิกการวิเคราะห์ (ภาพไม่ใช่ใบ)</em>");
      if ($("#advice").length) $("#advice").html("<em>—</em>");
      $("#output").text(
        JSON.stringify(gate.raw || { error: "leaf gate failed" }, null, 2)
      );
      return;
    } else {
      setAlert("ผ่านการตรวจขั้นต้น: ตรวจพบใบในภาพ", "ok");
    }

    const base = `https://classify.roboflow.com/${encodeURIComponent(
      ROBOFLOW_MODEL
    )}/${encodeURIComponent(ROBOFLOW_VERSION)}?api_key=${encodeURIComponent(
      ROBOFLOW_API_KEY
    )}`;
    let res;
    if (imageUrl) {
      res = await fetch(base + `&image=${encodeURIComponent(imageUrl)}`, {
        method: "POST",
      });
    } else {
      res = await fetch(base, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: base64,
      });
    }

    const j = await res.json();

    const CLASS_TH = {
      LEAF_BLIGHT: "โรคใบไหม้",
      ALGAL_LEAF_SPOT: "โรคจุดใบที่เกิดจากสาหร่าย",
      HEALTHY_LEAF: "ใบที่สมบูรณ์",
      ALLOCARIDARA_ATTACK: "การเข้าทำลายของเพลี้ยกระโดด",
      PHOMOPSIS_LEAF_SPOT: "โรคจุดใบฟอโมปซิส",
      LEAF_SPOT: "โรคจุดใบ",
    };

    // แสดง JSON ดิบ
    $("#output").text(
      JSON.stringify(
        {
          leaf_gate: gate.raw,
          disease: j,
        },
        null,
        2
      )
    );

    renderSummary(j, CLASS_TH);
    renderAdvice(j, CLASS_TH);
    // **บรรทัดที่เพิ่มเพื่อเรียกใช้ฟังก์ชันวาดกรอบ**
    // (ตอนนี้จะยังไม่แสดงผลเพราะโมเดลเป็นประเภท Classification)
    window.drawPredictions(j.predictions);

    $("#status").text("สำเร็จ");
  } catch (err) {
    $("#status").text("เกิดข้อผิดพลาด");
    $("#output").text(String(err));
  }
}

function renderSummary(resp, CLASS_TH = {}) {
  const top3Cards = $("#top3cards");
  let predictions = [];
  if (Array.isArray(resp?.predictions)) {
    predictions = resp.predictions;
  } else if (Array.isArray(resp?.predicted_classes)) {
    predictions = resp.predicted_classes.map((label) => ({
      class: label,
      confidence: 1,
    }));
  }

  if (!predictions.length) {
    top3Cards.addClass("hidden").html("");
    $("#summary").removeClass("hidden").html("<em>ไม่มีผลลัพธ์</em>");
    return;
  }

  const list = predictions
    .map((x) => ({
      cls: x.class || x.label || "Unknown",
      conf: Number(x.confidence || x.score || 1),
    }))
    .sort((a, b) => b.conf - a.conf)
    .slice(0, 3);

  const cardsHtml = list
    .map(
      (i) => `
      <div class="result-card">
        <span class="result-label">${CLASS_TH[i.cls] || i.cls}</span>
        <div class="result-confidence">
          <div class="progress-bar" style="width: ${(i.conf * 100).toFixed(
            1
          )}%;"></div>
        </div>
        <span class="confidence-text">${(i.conf * 100).toFixed(1)}%</span>
      </div>`
    )
    .join("");

  top3Cards.html(cardsHtml).removeClass("hidden");
  $("#summary").addClass("hidden");
}

function renderAdvice(resp, CLASS_TH = {}) {
  const el_tips = $("#advice-tips");
  const el_actives = $("#advice-actives");
  const el_fert = $("#advice-fert");

  if (el_tips.length === 0) return;

  let candidates = [];
  if (Array.isArray(resp?.predictions)) {
    candidates = resp.predictions.map((x) => String(x.class || x.label || ""));
  } else if (Array.isArray(resp?.predicted_classes)) {
    candidates = resp.predicted_classes.map(String);
  }
  const seen = new Set(),
    items = [];
  for (const c of candidates) {
    const key = normKey(c);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const adv = byRef(key);
    if (adv) {
      items.push({
        className: c,
        tips: adv.tips || [],
        fertilizer: adv.fertilizer || [],
        actives: adv.actives || [],
      });
    }
  }

  el_tips.empty();
  el_actives.empty();
  el_fert.empty();

  if (!items.length) {
    el_tips.html("<em>ยังไม่มีคำแนะนำ</em>");
    return;
  }

  const tipsHtml = items
    .map(
      (a) =>
        `<div class="adv"><b>${
          CLASS_TH[a.className] || escapeHtml(a.className)
        }</b>${
          a.tips?.length
            ? "<ul>" +
              a.tips.map((t) => `<li>${escapeHtml(t)}</li>`).join("") +
              "</ul>"
            : ""
        }</div>`
    )
    .join("");
  const activesHtml = items
    .map(
      (a) =>
        `<div class="adv"><b>${
          CLASS_TH[a.className] || escapeHtml(a.className)
        }</b>${
          a.actives?.length
            ? `<div class="chips">${a.actives
                .map((ac) => chipLink(`อ่านฉลาก: ${ac}`, googleLabelQuery(ac)))
                .join("")}</div>`
            : ""
        }</div>`
    )
    .join("");
  const fertHtml = items
    .map(
      (a) =>
        `<div class="adv"><b>${
          CLASS_TH[a.className] || escapeHtml(a.className)
        }</b>${
          a.fertilizer?.length
            ? `<div class="pills">${a.fertilizer
                .map((f) => `<span class="pill">${escapeHtml(f)}</span>`)
                .join("")}</div>`
            : ""
        }</div>`
    )
    .join("");

  el_tips.html(tipsHtml);
  el_actives.html(activesHtml);
  el_fert.html(fertHtml);

  $(".tabs .tab").removeClass("active");
  $('[data-tab="tips"]').addClass("active");
  el_tips.removeClass("hidden");
  el_actives.addClass("hidden");
  el_fert.addClass("hidden");
}

// ===== Leaf Gate =====
async function leafGate({ imageUrl, base64 }) {
  try {
    const url = `https://serverless.roboflow.com/${encodeURIComponent(
      LEAF_SEG_MODEL
    )}/${encodeURIComponent(LEAF_SEG_VERSION)}?api_key=${encodeURIComponent(
      ROBOFLOW_API_KEY
    )}`;
    let res;
    if (imageUrl) {
      res = await fetch(url + `&image=${encodeURIComponent(imageUrl)}`, {
        method: "POST",
      });
    } else {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: base64,
      });
    }
    const data = await res.json();
    const preds = Array.isArray(data?.predictions) ? data.predictions : [];
    const ok = preds.length > 0;
    return {
      ok,
      raw: data,
    };
  } catch (e) {
    return {
      ok: true,
      raw: {
        error: String(e),
        fallback: true,
      },
    };
  }
}

// ===== Helpers =====
function clearAll() {
  $("#file").val("");
  $("#url").val("");
  $("#preview").addClass("hidden").find("img").attr("src", "");
  // เพิ่มบรรทัดนี้เพื่อล้าง Canvas เมื่อมีการ Reset
  window.drawPredictions([]);
  if ($("#summary").length) $("#summary").html("<em>ยังไม่มีผลลัพธ์</em>");
  if ($("#top3cards").length) $("#top3cards").addClass("hidden").empty();
  if ($("#advice-tips").length)
    $("#advice-tips").html("<em>ยังไม่มีคำแนะนำ</em>");
  if ($("#advice-actives").length) $("#advice-actives").html("");
  if ($("#advice-fert").length) $("#advice-fert").html("");
  $("#output").text("รอผลลัพธ์…");
  $("#status").text("พร้อมทำงาน");
  setAlert();
}

function resetAll() {
  clearAll();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function copyJson() {
  const txt = $("#output").text();
  navigator.clipboard.writeText(txt).then(() => {
    $("#status").text("คัดลอก JSON แล้ว");
    setTimeout(() => $("#status").text("พร้อมทำงาน"), 1500);
  });
}

function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

function resizeBase64(base64, max = 1500) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      let w = img.width,
        h = img.height;
      if (w > h && w > max) {
        h *= max / w;
        w = max;
      } else if (h >= w && h > max) {
        w *= max / h;
        h = max;
      }
      c.width = Math.round(w);
      c.height = Math.round(h);
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.95));
    };
    img.src = base64;
  });
}

function setAlert(msg = "", type = "") {
  const box = $("#gateAlert");
  if (box.length === 0) return;
  if (!msg) {
    box.addClass("hidden").removeClass("error ok").text("");
    return;
  }
  box
    .removeClass("hidden")
    .toggleClass("error", type === "error")
    .toggleClass("ok", type === "ok")
    .text(msg);
}

function chipLink(label, href) {
  const safeHref = href.replace(/"/g, "%22");
  return `<span class="chip"><a href="${safeHref}" target="_blank" rel="noopener noreferrer">${escapeHtml(
    label
  )}</a></span>`;
}

function googleLabelQuery(active) {
  const q = encodeURIComponent(`${active} ฉลาก การใช้พืช อ่านฉลาก`);
  return `https://www.google.com/search?q=${q}`;
}

function googleSafetyQuery(active) {
  const q = encodeURIComponent(`${active} safety data sheet MSDS label`);
  return `https://www.google.com/search?q=${q}`;
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m])
  );
}

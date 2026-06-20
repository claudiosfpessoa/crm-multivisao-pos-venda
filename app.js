const STORAGE_KEY = "mv_crm_clients_v1";
const SCRIPTS_KEY = "mv_crm_scripts_v1";

const ORDER_STATUSES = [
  "Pedido realizado",
  "Produção das lentes",
  "Montagem",
  "Pedido expedido",
  "Disponível para retirada",
  "Lentes entregues",
  "Retorno agendado"
];

const LENS_TYPES = ["Visão simples", "Multifocal", "Ocupacional", "Solar grau", "Outro"];

const defaultScripts = {
  D0: `Olá, {nome}! Tudo bem?\n\nPassando para parabenizar pela sua compra na Multivisão Ótica. Seu pedido foi registrado com sucesso.\n\nPrevisão informada de entrega: {prazo}.\n\nQualquer atualização sobre sua lente, avisaremos por aqui. Seus olhos estão em boas mãos.`,
  D7_POSITIVO: `Olá, {nome}! Tudo bem?\n\nVocê já recebeu seus óculos. Gostaríamos de saber: sua adaptação com a lente está confortável?\n\nSe estiver tudo certo, sua avaliação no Google nos ajuda muito a continuar melhorando o atendimento:\n[COLE AQUI O LINK DA AVALIAÇÃO]`,
  D7_NEGATIVO: `Olá, {nome}. Entendi.\n\nPara avaliarmos sua adaptação com cuidado, podemos agendar um retorno na ótica. Assim verificamos ajuste da armação, conferência da lente e conforto visual.\n\nQual melhor horário para você?`,
  D7_OS: `Olá, {nome}! Tudo bem?\n\nPassando para atualizar o andamento do seu pedido.\n\nStatus atual: {status}.\n\nAssim que avançar para a próxima etapa, avisaremos por aqui.`,
  D21: `Olá, {nome}! Tudo bem?\n\nEstamos fazendo seu acompanhamento pós-venda. Como está sua adaptação com a lente {lente} {marca}?\n\nEstá confortável para leitura, distância e uso no dia a dia?`,
  M3: `Olá, {nome}! Tudo bem?\n\nJá se passaram cerca de 3 meses da entrega dos seus óculos.\n\nRecomendamos uma limpeza e manutenção preventiva: ajuste da armação, plaquetas, parafusos e higienização adequada das lentes.\n\nPodemos reservar um horário para você passar na Multivisão?`,
  M6: `Olá, {nome}! Tudo bem?\n\nEstamos fazendo uma pesquisa rápida de satisfação.\n\nDe 0 a 10, como você avalia sua experiência com seus óculos até agora?\n\nAs lentes continuam em bom estado, sem riscos relevantes ou perda de conforto visual?`,
  A1: `Olá, {nome}! Tudo bem?\n\nJá está próximo do período ideal para revisar sua visão e avaliar a renovação dos seus óculos.\n\nPodemos agendar seu exame e verificar se houve mudança no grau?\n\nA Multivisão pode te acompanhar nessa renovação com segurança e comodidade.`
};

let clients = normalizeClients(load(STORAGE_KEY, []));
let scripts = { ...defaultScripts, ...load(SCRIPTS_KEY, {}) };
let installPrompt = null;

const $ = (id) => document.getElementById(id);

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
}

function notify(message) {
  const target = $("statusMessage");
  target.textContent = message;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => {
    target.textContent = "";
  }, 4000);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function localToday() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;
}

function formatDate(dateStr) {
  if (!isDate(dateStr)) return "Não informado";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function shiftDate(dateStr, { days = 0, months = 0, years = 0 }) {
  const date = new Date(`${dateStr}T12:00:00`);
  const originalDay = date.getDate();
  date.setDate(1);
  date.setFullYear(date.getFullYear() + years);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDay) + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function diffDays(dateStr) {
  const today = new Date(`${localToday()}T12:00:00`);
  const date = new Date(`${dateStr}T12:00:00`);
  return Math.round((date - today) / 86400000);
}

function postDeliveryBase(client) {
  return client.actualDeliveryDate || client.deliveryDate || client.saleDate;
}

function getSteps(client) {
  const deliveryBase = postDeliveryBase(client);
  const hasDelivered = Boolean(client.actualDeliveryDate) || client.orderStatus === "Lentes entregues";
  const d7Base = hasDelivered ? deliveryBase : client.saleDate;

  return [
    { key: "D0", label: "D0 | Fechamento da venda", date: client.saleDate, scriptKey: "D0" },
    {
      key: "D7",
      label: hasDelivered ? "D7 | Checagem de adaptação" : "D7 | Atualização da OS",
      date: shiftDate(d7Base, { days: 7 }),
      scriptKey: hasDelivered ? "D7_POSITIVO" : "D7_OS"
    },
    { key: "D21", label: "D21 | Segunda checagem de adaptação", date: shiftDate(deliveryBase, { days: 21 }), scriptKey: "D21" },
    { key: "3M", label: "3 meses | Limpeza preventiva", date: shiftDate(deliveryBase, { months: 3 }), scriptKey: "M3" },
    { key: "6M", label: "6 meses | Pesquisa de satisfação", date: shiftDate(deliveryBase, { months: 6 }), scriptKey: "M6" },
    { key: "1A", label: "1 ano | Renovação / exame", date: shiftDate(deliveryBase, { years: 1 }), scriptKey: "A1" }
  ];
}

function nextStep(client) {
  return getSteps(client).find((step) => !client.completed.includes(step.key)) || null;
}

function stageBadge(step) {
  const days = diffDays(step.date);
  if (days < 0) return `<span class="badge late">Atrasado ${Math.abs(days)}d</span>`;
  if (days === 0) return `<span class="badge today">Hoje</span>`;
  return `<span class="badge future">Em ${days}d</span>`;
}

function parsePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits;
  return `55${digits}`;
}

function validPhone(phone) {
  const length = parsePhone(phone).length;
  return length >= 12 && length <= 13;
}

function personalize(template, client) {
  return String(template || "")
    .replaceAll("{nome}", client.name)
    .replaceAll("{prazo}", formatDate(client.deliveryDate))
    .replaceAll("{status}", client.orderStatus)
    .replaceAll("{lente}", client.lensType)
    .replaceAll("{marca}", client.lensBrand);
}

function whatsappUrl(client, message) {
  return `https://wa.me/${parsePhone(client.phone)}?text=${encodeURIComponent(message)}`;
}

function normalizeClients(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((client) => client && typeof client === "object" && client.name && isDate(client.saleDate))
    .map((client) => ({
      id: String(client.id || crypto.randomUUID()),
      name: String(client.name).trim(),
      phone: String(client.phone || "").trim(),
      saleDate: client.saleDate,
      deliveryDate: isDate(client.deliveryDate) ? client.deliveryDate : "",
      actualDeliveryDate: isDate(client.actualDeliveryDate) ? client.actualDeliveryDate : "",
      lensType: LENS_TYPES.includes(client.lensType) ? client.lensType : "Outro",
      lensBrand: String(client.lensBrand || "").trim(),
      orderStatus: ORDER_STATUSES.includes(client.orderStatus) ? client.orderStatus : ORDER_STATUSES[0],
      saleValue: String(client.saleValue || ""),
      notes: String(client.notes || "").trim(),
      completed: Array.isArray(client.completed)
        ? [...new Set(client.completed.filter((key) => ["D0", "D7", "D21", "3M", "6M", "1A"].includes(key)))]
        : []
    }));
}

function renderScripts() {
  const container = $("scriptsEditor");
  container.innerHTML = Object.keys(defaultScripts).map((key) => `
    <label class="script-box">${escapeHtml(scriptLabel(key))}
      <textarea data-script="${key}">${escapeHtml(scripts[key])}</textarea>
    </label>
  `).join("");

  container.querySelectorAll("textarea").forEach((area) => {
    area.addEventListener("input", () => {
      scripts[area.dataset.script] = area.value;
      save();
    });
  });
}

function scriptLabel(key) {
  return {
    D0: "D0 | Compra",
    D7_POSITIVO: "D7 | Entregue positivo",
    D7_NEGATIVO: "D7 | Entregue negativo",
    D7_OS: "D7 | OS não entregue",
    D21: "D21 | Adaptação",
    M3: "3 meses | Manutenção",
    M6: "6 meses | Satisfação",
    A1: "1 ano | Renovação"
  }[key] || key;
}

function render() {
  const search = $("searchInput").value.toLowerCase().trim();
  const stage = $("filterStage").value;
  const status = $("filterStatus").value;

  const sorted = [...clients].sort((a, b) => {
    const aDate = nextStep(a)?.date || "9999-12-31";
    const bDate = nextStep(b)?.date || "9999-12-31";
    return aDate.localeCompare(bDate);
  });

  const filtered = sorted.filter((client) => {
    const step = nextStep(client);
    const text = `${client.name} ${client.phone} ${client.lensType} ${client.lensBrand} ${client.orderStatus}`.toLowerCase();
    return text.includes(search)
      && (!stage || step?.key === stage)
      && (!status || client.orderStatus === status);
  });

  $("clientList").innerHTML = filtered.length
    ? filtered.map(clientCard).join("")
    : `<p class="meta">Nenhum cliente encontrado.</p>`;

  const pending = clients.map(nextStep).filter(Boolean);
  $("kpiTotal").textContent = clients.length;
  $("kpiToday").textContent = pending.filter((step) => diffDays(step.date) === 0).length;
  $("kpiLate").textContent = pending.filter((step) => diffDays(step.date) < 0).length;
  $("kpiRenewal").textContent = clients.filter((client) => {
    if (client.completed.includes("1A")) return false;
    const renewal = getSteps(client).find((step) => step.key === "1A");
    const days = diffDays(renewal.date);
    return days >= 0 && days <= 30;
  }).length;

  document.querySelectorAll("[data-open]").forEach((button) => {
    button.onclick = () => openClient(button.dataset.open);
  });
  document.querySelectorAll("[data-wa]").forEach((button) => {
    button.onclick = () => sendNextWhatsApp(button.dataset.wa);
  });
  document.querySelectorAll("[data-done]").forEach((button) => {
    button.onclick = () => {
      const client = clients.find((item) => item.id === button.dataset.done);
      const step = client && nextStep(client);
      if (step) toggleDone(client.id, step.key);
    };
  });
}

function clientCard(client) {
  const step = nextStep(client);
  const safeId = escapeHtml(client.id);
  const action = step
    ? `
      <span class="badge">${escapeHtml(step.key)}</span>
      ${stageBadge(step)}
      <span class="badge">${escapeHtml(client.orderStatus)}</span>
    `
    : `<span class="badge complete">Ciclo concluído</span>`;

  const nextAction = step
    ? `Próxima ação: <strong>${escapeHtml(step.label)}</strong> em ${formatDate(step.date)}`
    : "Todas as etapas do acompanhamento foram concluídas.";

  return `
    <article class="client-card">
      <div class="client-top">
        <div>
          <h3>${escapeHtml(client.name)}</h3>
          <div class="meta">${escapeHtml(client.phone)} • Venda: ${formatDate(client.saleDate)} • ${escapeHtml(client.lensType)}</div>
        </div>
        <div class="badges">${action}</div>
      </div>
      <div class="meta">${nextAction}</div>
      <div class="card-actions">
        ${step ? `<button class="btn primary" data-wa="${safeId}">Enviar WhatsApp</button>` : ""}
        <button class="btn secondary" data-open="${safeId}">Abrir ficha</button>
        ${step ? `<button class="btn secondary" data-done="${safeId}">Marcar etapa feita</button>` : ""}
      </div>
    </article>
  `;
}

function sendNextWhatsApp(id) {
  const client = clients.find((item) => item.id === id);
  const step = client && nextStep(client);
  if (!client || !step) return;
  if (!validPhone(client.phone)) {
    alert("Informe um WhatsApp válido com DDD antes de enviar.");
    openClient(id);
    return;
  }
  window.open(whatsappUrl(client, personalize(scripts[step.scriptKey], client)), "_blank", "noopener");
}

function options(values, selected) {
  return values.map((value) => `
    <option ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>
  `).join("");
}

function openClient(id) {
  const client = clients.find((item) => item.id === id);
  if (!client) return;

  $("modalName").textContent = client.name;
  $("modalBody").innerHTML = `
    <div class="small-grid">
      <label>Nome
        <input id="modalClientName" value="${escapeHtml(client.name)}">
      </label>
      <label>WhatsApp
        <input id="modalPhone" value="${escapeHtml(client.phone)}">
      </label>
      <label>Data da venda
        <input id="modalSaleDate" type="date" value="${escapeHtml(client.saleDate)}">
      </label>
      <label>Prazo de entrega
        <input id="modalDelivery" type="date" value="${escapeHtml(client.deliveryDate)}">
      </label>
      <label>Entrega real
        <input id="modalActualDelivery" type="date" value="${escapeHtml(client.actualDeliveryDate)}">
      </label>
      <label>Status da OS
        <select id="modalStatus">${options(ORDER_STATUSES, client.orderStatus)}</select>
      </label>
      <label>Tipo de lente
        <select id="modalLensType">${options(LENS_TYPES, client.lensType)}</select>
      </label>
      <label>Marca / tratamento
        <input id="modalLensBrand" value="${escapeHtml(client.lensBrand)}">
      </label>
      <label>Valor
        <input id="modalValue" type="number" min="0" step="0.01" value="${escapeHtml(client.saleValue)}">
      </label>
    </div>

    <label>Observações
      <textarea id="modalNotes">${escapeHtml(client.notes)}</textarea>
    </label>

    <div class="timeline">
      ${getSteps(client).map((step) => {
        const done = client.completed.includes(step.key);
        const message = personalize(scripts[step.scriptKey], client);
        return `
          <div class="step ${done ? "done" : ""}">
            <div class="step-head">
              <div>
                <h4>${escapeHtml(step.label)}</h4>
                <div class="meta">Data programada: ${formatDate(step.date)}</div>
              </div>
              <div class="badges">${stageBadge(step)} ${done ? `<span class="badge complete">Concluído</span>` : ""}</div>
            </div>
            <textarea data-msg="${step.key}">${escapeHtml(message)}</textarea>
            <div class="card-actions">
              <button class="btn whatsapp" data-modal-wa="${step.key}">Enviar WhatsApp</button>
              <button class="btn secondary" data-modal-done="${step.key}">
                ${done ? "Reabrir etapa" : "Marcar concluído"}
              </button>
            </div>
          </div>
        `;
      }).join("")}
    </div>

    <div class="card-actions" style="margin-top:16px">
      <button id="saveModal" class="btn primary">Salvar alterações</button>
      <button id="deleteClient" class="btn delete">Excluir cliente</button>
    </div>
  `;

  if (!$("clientModal").open) $("clientModal").showModal();

  $("saveModal").onclick = () => {
    const name = $("modalClientName").value.trim();
    const saleDate = $("modalSaleDate").value;
    if (!name || !isDate(saleDate)) {
      alert("Informe o nome e uma data de venda válida.");
      return;
    }
    client.name = name;
    client.phone = $("modalPhone").value.trim();
    client.saleDate = saleDate;
    client.deliveryDate = $("modalDelivery").value;
    client.actualDeliveryDate = $("modalActualDelivery").value;
    client.orderStatus = $("modalStatus").value;
    client.lensType = $("modalLensType").value;
    client.lensBrand = $("modalLensBrand").value.trim();
    client.saleValue = $("modalValue").value;
    client.notes = $("modalNotes").value.trim();
    if (client.actualDeliveryDate && client.orderStatus !== "Retorno agendado") {
      client.orderStatus = "Lentes entregues";
    }
    save();
    render();
    openClient(id);
    notify("Alterações salvas.");
  };

  $("deleteClient").onclick = () => {
    if (!confirm("Excluir este cliente do CRM?")) return;
    clients = clients.filter((item) => item.id !== id);
    save();
    $("clientModal").close();
    render();
    notify("Cliente excluído.");
  };

  document.querySelectorAll("[data-modal-wa]").forEach((button) => {
    button.onclick = () => {
      if (!validPhone(client.phone)) {
        alert("Informe um WhatsApp válido com DDD antes de enviar.");
        return;
      }
      const message = document.querySelector(`[data-msg="${button.dataset.modalWa}"]`).value;
      window.open(whatsappUrl(client, message), "_blank", "noopener");
    };
  });

  document.querySelectorAll("[data-modal-done]").forEach((button) => {
    button.onclick = () => toggleDone(id, button.dataset.modalDone, true);
  });
}

function toggleDone(id, stepKey, keepModal = false) {
  const client = clients.find((item) => item.id === id);
  if (!client) return;
  const index = client.completed.indexOf(stepKey);
  if (index >= 0) client.completed.splice(index, 1);
  else client.completed.push(stepKey);
  save();
  render();
  if (keepModal && $("clientModal").open) openClient(id);
}

$("clientForm").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validPhone($("phone").value)) {
    alert("Informe um WhatsApp válido com DDD.");
    $("phone").focus();
    return;
  }

  const client = {
    id: crypto.randomUUID(),
    name: $("name").value.trim(),
    phone: $("phone").value.trim(),
    saleDate: $("saleDate").value,
    deliveryDate: $("deliveryDate").value,
    actualDeliveryDate: $("actualDeliveryDate").value,
    lensType: $("lensType").value,
    lensBrand: $("lensBrand").value.trim(),
    orderStatus: $("actualDeliveryDate").value ? "Lentes entregues" : $("orderStatus").value,
    saleValue: $("saleValue").value,
    notes: $("notes").value.trim(),
    completed: []
  };

  clients.push(client);
  save();
  event.target.reset();
  $("saleDate").value = localToday();
  render();
  notify("Cliente salvo com sucesso.");
});

["searchInput", "filterStage", "filterStatus"].forEach((id) => {
  $(id).addEventListener("input", render);
});

$("closeModal").onclick = () => $("clientModal").close();
$("clientModal").addEventListener("click", (event) => {
  if (event.target === $("clientModal")) $("clientModal").close();
});

$("btnExport").onclick = () => {
  const content = JSON.stringify({
    version: 2,
    exportedAt: new Date().toISOString(),
    clients,
    scripts
  }, null, 2);
  const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `crm_multivisao_backup_${localToday()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  notify("Backup exportado.");
};

$("importFile").onchange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.clients)) throw new Error("Formato inválido");
      const importedClients = normalizeClients(data.clients);
      if (data.clients.length && !importedClients.length) throw new Error("Clientes inválidos");
      if (!confirm(`Importar ${importedClients.length} cliente(s) e substituir os dados atuais?`)) return;
      clients = importedClients;
      if (data.scripts && typeof data.scripts === "object") {
        scripts = { ...defaultScripts, ...data.scripts };
      }
      save();
      render();
      renderScripts();
      notify("Backup importado com sucesso.");
    } catch {
      alert("Arquivo de backup inválido.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
};

$("btnReset").onclick = () => {
  if (!confirm("Tem certeza que deseja apagar todos os clientes deste navegador?")) return;
  clients = [];
  save();
  render();
  notify("CRM limpo.");
};

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  $("btnInstall").hidden = false;
});

$("btnInstall").onclick = async () => {
  if (!installPrompt) {
    alert("No Microsoft Edge, abra o menu ⋯ e escolha Aplicativos > Instalar CRM Pós-venda.");
    return;
  }
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $("btnInstall").hidden = true;
};

window.addEventListener("appinstalled", () => {
  $("btnInstall").hidden = true;
  notify("Aplicativo instalado com sucesso.");
});

function updateConnectionStatus() {
  $("connectionStatus").textContent = navigator.onLine
    ? "Aplicativo pronto para uso offline."
    : "Sem internet — trabalhando normalmente no modo offline.";
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

if ("serviceWorker" in navigator && ["http:", "https:"].includes(location.protocol)) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      $("connectionStatus").textContent = "Não foi possível ativar o modo offline.";
    });
  });
}

$("saleDate").value = localToday();
updateConnectionStatus();
renderScripts();
render();

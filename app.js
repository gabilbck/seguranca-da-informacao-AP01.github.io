const USERS = [
  {
    id: 1,
    name: "Ana Souza",
    email: "aluno@faculdade.local",
    password: "123456",
    role: "ALUNO",
    studentId: "202400001",
    studentClass: "5A"
  },
  {
    id: 2,
    name: "Prof. Carlos Lima",
    email: "professor@faculdade.local",
    password: "123456",
    role: "PROFESSOR",
    classes: ["5A", "5B"]
  },
  {
    id: 3,
    name: "Administrador Geral",
    email: "admin@faculdade.local",
    password: "admin",
    role: "ADMIN"
  }
];

const STORAGE_KEYS = {
  session: "ocorrencias_sessao",
  occurrences: "ocorrencias_registros",
  audit: "ocorrencias_logs"
};

const INITIAL_OCCURRENCES = [
  {
    id: "OC-0999",
    studentName: "Ana Souza",
    studentId: "202400001",
    studentClass: "5A",
    studentCpf: "000.111.222-33",
    studentEmail: "aluno@faculdade.local",
    studentPhone: "(47) 96666-4040",
    category: "Solicitação administrativa",
    priority: "Baixa",
    description: "Solicitação fictícia de documentação para estágio.",
    internalNote: "Encaminhar à secretaria acadêmica.",
    status: "Aberta",
    createdBy: "aluno@faculdade.local",
    createdAt: "2026-05-04T14:20:00.000Z"
  },
  {
    id: "OC-1001",
    studentName: "Marina Alves",
    studentId: "202300145",
    studentClass: "5A",
    studentCpf: "123.456.789-10",
    studentEmail: "marina.alves@email.local",
    studentPhone: "(47) 99999-1010",
    category: "Nota",
    priority: "Média",
    description: "Solicitação de revisão de nota da avaliação bimestral.",
    internalNote: "Verificar com a coordenação antes de responder.",
    status: "Aberta",
    createdBy: "professor@faculdade.local",
    createdAt: "2026-05-05T18:40:00.000Z"
  },
  {
    id: "OC-1002",
    studentName: "Rafael Martins",
    studentId: "202200771",
    studentClass: "5B",
    studentCpf: "987.654.321-00",
    studentEmail: "rafael.martins@email.local",
    studentPhone: "(47) 98888-2020",
    category: "Frequência",
    priority: "Alta",
    description: "Aluno contesta lançamento de falta em aula prática.",
    internalNote: "Conferir chamada manual.",
    status: "Em análise",
    createdBy: "professor@faculdade.local",
    createdAt: "2026-05-05T18:50:00.000Z"
  },
  {
    id: "OC-1003",
    studentName: "Beatriz Costa",
    studentId: "202100441",
    studentClass: "3C",
    studentCpf: "111.222.333-44",
    studentEmail: "beatriz.costa@email.local",
    studentPhone: "(47) 97777-3030",
    category: "Solicitação administrativa",
    priority: "Crítica",
    description: "Solicitação envolvendo documentação acadêmica e prazo de matrícula.",
    internalNote: "Priorizar atendimento.",
    status: "Aberta",
    createdBy: "admin@faculdade.local",
    createdAt: "2026-05-05T19:00:00.000Z"
  }
];

const loginView = document.querySelector("#loginView");
const appView = document.querySelector("#appView");
const loginForm = document.querySelector("#loginForm");
const occurrenceForm = document.querySelector("#occurrenceForm");
const logoutBtn = document.querySelector("#logoutBtn");
const exportBtn = document.querySelector("#exportBtn");
const clearLogsBtn = document.querySelector("#clearLogsBtn");
const resetBtn = document.querySelector("#resetBtn");
const sessionBadge = document.querySelector("#sessionBadge");
const currentUserName = document.querySelector("#currentUserName");
const currentUserDetails = document.querySelector("#currentUserDetails");
const accessScopeLabel = document.querySelector("#accessScopeLabel");
const occurrencesTable = document.querySelector("#occurrencesTable");
const auditLog = document.querySelector("#auditLog");
const totalOccurrences = document.querySelector("#totalOccurrences");
const criticalOccurrences = document.querySelector("#criticalOccurrences");
const lastUpdate = document.querySelector("#lastUpdate");
const auditSection = document.querySelector("#auditSection");
const quickActionsCard = document.querySelector("#quickActionsCard");
const studentClassWrap = document.querySelector("#studentClassWrap");
const internalNoteField = document.querySelector("#internalNote");

function escapeHtml(value) {
  const s = String(value ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeOccurrence(item) {
  return {
    ...item,
    studentClass: item.studentClass || ""
  };
}

function getOccurrences() {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.occurrences) || "[]");
  return raw.map(normalizeOccurrence);
}

function saveOccurrences(occurrences) {
  localStorage.setItem(STORAGE_KEYS.occurrences, JSON.stringify(occurrences));
}

function getAuditLogs() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.audit) || "[]");
}

function saveAuditLogs(logs) {
  localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify(logs));
}

function getSession() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || "null");
}

function saveSession(user) {
  const { password: _p, ...rest } = user;
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(rest));
}

function writeLog(action, detail) {
  const session = getSession();
  const logs = getAuditLogs();
  logs.unshift({
    when: new Date().toISOString(),
    user: session ? session.email : "anonimo",
    role: session ? session.role : "SEM_SESSAO",
    action,
    detail
  });
  saveAuditLogs(logs);
}

function professorSeesOccurrence(session, occ) {
  if (!session.classes || !Array.isArray(session.classes)) {
    return false;
  }
  if (occ.createdBy === session.email) {
    return true;
  }
  const cls = (occ.studentClass || "").trim();
  return cls !== "" && session.classes.includes(cls);
}

function canViewOccurrence(session, occ) {
  if (!session) {
    return false;
  }
  if (session.role === "ADMIN") {
    return true;
  }
  if (session.role === "ALUNO") {
    return occ.studentId === session.studentId;
  }
  if (session.role === "PROFESSOR") {
    return professorSeesOccurrence(session, occ);
  }
  return false;
}

function canChangeStatus(session, occ) {
  if (!session) {
    return false;
  }
  if (session.role === "ADMIN") {
    return true;
  }
  if (session.role === "PROFESSOR") {
    return professorSeesOccurrence(session, occ);
  }
  return false;
}

function canDeleteOccurrence(session, occ) {
  if (!session) {
    return false;
  }
  if (session.role === "ADMIN") {
    return true;
  }
  if (session.role === "PROFESSOR") {
    return occ.createdBy === session.email;
  }
  return false;
}

function usersForExport() {
  return USERS.map((u) => {
    const { password, ...rest } = u;
    return { ...rest, password: "[omitido no arquivo exportado]" };
  });
}

function showLogin() {
  loginView.classList.remove("hidden");
  appView.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  sessionBadge.textContent = "Sessão não iniciada";
  sessionBadge.classList.add("muted");
}

function applyFormMode(session) {
  const nameInput = document.querySelector("#studentName");
  const idInput = document.querySelector("#studentId");
  const emailInput = document.querySelector("#studentEmail");
  const classInput = document.querySelector("#studentClass");
  const readOnly = (el, on) => {
    el.readOnly = on;
    el.classList.toggle("field-readonly", on);
  };
  if (!session) {
    return;
  }
  if (session.role === "ALUNO") {
    studentClassWrap.classList.add("hidden");
    nameInput.value = session.name || "";
    idInput.value = session.studentId || "";
    emailInput.value = session.email || "";
    readOnly(nameInput, true);
    readOnly(idInput, true);
    readOnly(emailInput, true);
    if (internalNoteField) {
      internalNoteField.closest("label").classList.add("hidden");
    }
  } else {
    studentClassWrap.classList.remove("hidden");
    readOnly(nameInput, false);
    readOnly(idInput, false);
    readOnly(emailInput, false);
    if (internalNoteField) {
      internalNoteField.closest("label").classList.remove("hidden");
    }
    if (session.role === "PROFESSOR" || session.role === "ADMIN") {
      nameInput.value = "";
      idInput.value = "";
      emailInput.value = "";
      classInput.value = "";
    }
  }
}

function showApp(user) {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
  sessionBadge.textContent = `${user.name} — ${user.role}`;
  sessionBadge.classList.remove("muted");
  currentUserName.textContent = user.name;
  currentUserDetails.textContent = `${user.email} | Perfil: ${user.role}`;
  if (user.role === "ADMIN") {
    accessScopeLabel.textContent = "Escopo: todas as ocorrências, logs e ações administrativas.";
    auditSection.classList.remove("hidden");
    quickActionsCard.classList.remove("hidden");
  } else if (user.role === "PROFESSOR") {
    accessScopeLabel.textContent = "Escopo: ocorrências das turmas sob sua responsabilidade e registros por você criados.";
    auditSection.classList.add("hidden");
    quickActionsCard.classList.add("hidden");
  } else {
    accessScopeLabel.textContent = "Escopo: somente ocorrências vinculadas à sua matrícula.";
    auditSection.classList.add("hidden");
    quickActionsCard.classList.add("hidden");
  }
  applyFormMode(user);
  render();
}

function login(email, password) {
  const user = USERS.find((item) => item.email === email && item.password === password);
  if (!user) {
    alert("Usuário ou senha inválidos.");
    writeLog("LOGIN_FALHOU", `Tentativa para ${email}`);
    return;
  }
  saveSession(user);
  writeLog("LOGIN_OK", `Usuário ${user.email} entrou no sistema.`);
  showApp(user);
}

function logout() {
  const session = getSession();
  writeLog("LOGOUT", session ? `${session.email} saiu do sistema.` : "Sessão encerrada.");
  localStorage.removeItem(STORAGE_KEYS.session);
  showLogin();
}

function createOccurrence(event) {
  event.preventDefault();
  const session = getSession();
  if (!session) {
    return;
  }
  const privacyAck = document.querySelector("#privacyAck").checked;
  if (!privacyAck) {
    alert("É necessário confirmar o tratamento dos dados antes de salvar.");
    return;
  }
  let studentName = document.querySelector("#studentName").value.trim();
  let studentId = document.querySelector("#studentId").value.trim();
  let studentClass = document.querySelector("#studentClass").value.trim();
  const studentCpf = document.querySelector("#studentCpf").value.trim();
  let studentEmail = document.querySelector("#studentEmail").value.trim();
  const studentPhone = document.querySelector("#studentPhone").value.trim();
  const category = document.querySelector("#category").value;
  const priority = document.querySelector("#priority").value;
  const description = document.querySelector("#description").value.trim();
  const internalNote = session.role === "ALUNO" ? "" : (internalNoteField ? internalNoteField.value.trim() : "");
  if (!studentName || !studentId || !studentCpf || !studentEmail || !description) {
    alert("Preencha os campos obrigatórios: nome, matrícula, CPF, e-mail e descrição.");
    return;
  }
  if (session.role === "ALUNO") {
    if (studentId !== session.studentId) {
      alert("A matrícula deve coincidir com a do usuário autenticado.");
      return;
    }
    studentClass = session.studentClass || "";
  } else {
    if (!studentClass) {
      alert("Informe a turma do aluno para permitir o roteamento ao docente responsável.");
      return;
    }
  }
  if (!confirm("Confirma o cadastro desta ocorrência no sistema?")) {
    return;
  }
  const occurrence = {
    id: `OC-${Math.floor(Math.random() * 9000) + 1000}`,
    studentName,
    studentId,
    studentClass,
    studentCpf,
    studentEmail,
    studentPhone,
    category,
    priority,
    description,
    internalNote,
    privacyAck,
    status: "Aberta",
    createdBy: session.email,
    createdAt: new Date().toISOString()
  };
  const occurrences = getOccurrences();
  occurrences.unshift(occurrence);
  saveOccurrences(occurrences);
  writeLog(
    "OCORRENCIA_CRIADA",
    `Criada ocorrência ${occurrence.id} para matrícula ${occurrence.studentId}.`
  );
  occurrenceForm.reset();
  applyFormMode(session);
  render();
}

function deleteOccurrence(id) {
  const session = getSession();
  const occurrences = getOccurrences();
  const occurrence = occurrences.find((item) => item.id === id);
  if (!occurrence || !canDeleteOccurrence(session, occurrence)) {
    alert("Operação não permitida para o seu perfil.");
    writeLog("EXCLUSAO_NEGADA", `Tentativa sobre ${id} por ${session ? session.email : "—"}.`);
    return;
  }
  if (!confirm(`Confirma a exclusão permanente da ocorrência ${id}? Esta ação não pode ser desfeita.`)) {
    return;
  }
  const updated = occurrences.filter((item) => item.id !== id);
  saveOccurrences(updated);
  writeLog("OCORRENCIA_EXCLUIDA", `Ocorrência ${id} excluída.`);
  render();
}

function changeStatus(id, status) {
  const session = getSession();
  const occurrences = getOccurrences();
  const occurrence = occurrences.find((item) => item.id === id);
  if (!occurrence || !canChangeStatus(session, occurrence)) {
    alert("Alteração de status não permitida para o seu perfil ou escopo.");
    writeLog("STATUS_NEGADO", `Tentativa ${status} em ${id}.`);
    return;
  }
  occurrence.status = status;
  occurrence.updatedAt = new Date().toISOString();
  saveOccurrences(occurrences);
  writeLog("STATUS_ALTERADO", `Ocorrência ${id} alterada para ${status}.`);
  render();
}

function exportEverything() {
  const session = getSession();
  if (!session || session.role !== "ADMIN") {
    alert("Exportação completa restrita ao perfil administrador.");
    return;
  }
  const payload = {
    exportedAt: new Date().toISOString(),
    exportedBy: session,
    users: usersForExport(),
    occurrences: getOccurrences(),
    audit: getAuditLogs()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "backup-completo-ocorrencias.json";
  anchor.click();
  URL.revokeObjectURL(url);
  writeLog("EXPORTACAO_TOTAL", "Administrador exportou conjunto de dados do protótipo.");
}

function clearLogs() {
  const session = getSession();
  if (!session || session.role !== "ADMIN") {
    return;
  }
  if (!confirm("Confirma a exclusão de todos os registros de log? Esta ação não pode ser desfeita.")) {
    return;
  }
  saveAuditLogs([]);
  render();
}

function resetData() {
  const session = getSession();
  if (!session || session.role !== "ADMIN") {
    alert("Restauração restrita ao perfil administrador.");
    return;
  }
  if (!confirm("Confirma a restauração dos dados iniciais? As ocorrências e logs atuais serão substituídos e a sessão será encerrada.")) {
    return;
  }
  const adminEmail = session.email;
  localStorage.setItem(STORAGE_KEYS.occurrences, JSON.stringify(INITIAL_OCCURRENCES));
  localStorage.setItem(
    STORAGE_KEYS.audit,
    JSON.stringify([
      {
        when: new Date().toISOString(),
        user: adminEmail,
        role: "ADMIN",
        action: "RESET_BASE",
        detail: "Dados iniciais restaurados e sessão encerrada."
      }
    ])
  );
  localStorage.removeItem(STORAGE_KEYS.session);
  boot();
}

function internalNoteForDisplay(session, occ) {
  if (!session || session.role === "ALUNO") {
    return "—";
  }
  return occ.internalNote || "—";
}

function normalizeSearchString(value) {
  let s = String(value ?? "").toLowerCase();
  try {
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    s = String(value ?? "").toLowerCase();
  }
  return s;
}

function occurrenceMatchesSearch(item, session, rawTerm) {
  const term = normalizeSearchString(rawTerm).trim();
  if (!term) {
    return true;
  }
  const parts = [
    item.id,
    item.studentName,
    item.studentId,
    item.studentClass,
    item.studentCpf,
    item.studentEmail,
    item.studentPhone,
    item.category,
    item.priority,
    item.status,
    item.description,
    item.createdBy,
    item.createdAt,
    item.updatedAt
  ];
  if (session && session.role !== "ALUNO") {
    parts.push(item.internalNote);
  }
  const hay = normalizeSearchString(parts.filter(Boolean).join(" "));
  const hayCompact = hay.replace(/[^a-z0-9]/g, "");
  const termCompact = term.replace(/[^a-z0-9]/g, "");
  if (hay.includes(term)) {
    return true;
  }
  if (termCompact.length > 0 && hayCompact.includes(termCompact)) {
    return true;
  }
  const tokens = term.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every((t) => hay.includes(t) || (t.replace(/[^a-z0-9]/g, "").length > 0 && hayCompact.includes(t.replace(/[^a-z0-9]/g, ""))));
  }
  return false;
}

function getSearchTerm() {
  const el = document.getElementById("occurrenceSearchInput");
  return el ? el.value : "";
}

function render() {
  const session = getSession();
  const term = getSearchTerm();
  const occurrences = getOccurrences();
  const visible = occurrences.filter((item) => canViewOccurrence(session, item));
  const filtered = visible.filter((item) => occurrenceMatchesSearch(item, session, term));
  totalOccurrences.textContent = String(visible.length);
  criticalOccurrences.textContent = String(visible.filter((item) => item.priority === "Crítica").length);
  lastUpdate.textContent = `Atualizado em ${new Date().toLocaleTimeString("pt-BR")}`;
  if (filtered.length === 0) {
    occurrencesTable.innerHTML = `<tr><td colspan="8" class="muted-text">Nenhum registro encontrado para o filtro atual.</td></tr>`;
  } else {
    occurrencesTable.innerHTML = filtered
      .map((item) => {
        const prKey = ["Baixa", "Média", "Alta", "Crítica"].includes(item.priority) ? item.priority : "Média";
        const showActions = session && (canChangeStatus(session, item) || canDeleteOccurrence(session, item));
        const statusBlock = canChangeStatus(session, item)
          ? `<div class="row-actions">
          <button type="button" class="btn secondary" data-action="status" data-id="${escapeHtml(item.id)}" data-status="Em análise">Em análise</button>
          <button type="button" class="btn secondary" data-action="status" data-id="${escapeHtml(item.id)}" data-status="Resolvida">Resolver</button>
        </div>`
          : "";
        const delBlock = canDeleteOccurrence(session, item)
          ? `<button type="button" class="btn danger" data-action="delete" data-id="${escapeHtml(item.id)}">Excluir</button>`
          : "";
        const actionsHtml = showActions
          ? `<div class="row-actions">${statusBlock}${delBlock}</div>`
          : `<span class="muted-text">—</span>`;
        const note = escapeHtml(internalNoteForDisplay(session, item));
        return `<tr>
      <td>
        <strong>${escapeHtml(item.studentName)}</strong><br />
        <span class="muted-text">${escapeHtml(item.studentId)}</span>
        ${item.studentClass ? `<br /><span class="muted-text">Turma ${escapeHtml(item.studentClass)}</span>` : ""}
      </td>
      <td>${escapeHtml(item.studentCpf)}</td>
      <td>
        ${escapeHtml(item.studentEmail)}<br />
        ${escapeHtml(item.studentPhone)}
      </td>
      <td>${escapeHtml(item.category)}</td>
      <td><span class="priority ${prKey}">${escapeHtml(item.priority)}</span></td>
      <td>${escapeHtml(item.status)}</td>
      <td>
        <strong>Descrição:</strong> ${escapeHtml(item.description)}<br />
        <strong>Obs. interna:</strong> ${note}
      </td>
      <td>${actionsHtml}</td>
    </tr>`;
      })
      .join("");
  }
  if (session && session.role === "ADMIN") {
    const logs = getAuditLogs();
    if (logs.length === 0) {
      auditLog.innerHTML = `<div class="notice">Nenhum log registrado.</div>`;
    } else {
      auditLog.innerHTML = logs
        .map(
          (log) => `
      <div class="log-item">
        <strong>${escapeHtml(log.when)}</strong><br />
        usuário=${escapeHtml(log.user || "—")} | perfil=${escapeHtml(log.role || "—")} | ação=${escapeHtml(log.action)}<br />
        detalhe=${escapeHtml(log.detail)}
      </div>`
        )
        .join("");
    }
  }
}

function boot() {
  if (!localStorage.getItem(STORAGE_KEYS.occurrences)) {
    localStorage.setItem(STORAGE_KEYS.occurrences, JSON.stringify(INITIAL_OCCURRENCES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.audit)) {
    localStorage.setItem(
      STORAGE_KEYS.audit,
      JSON.stringify([
        {
          when: new Date().toISOString(),
          user: "sistema",
          action: "BASE_INICIAL_CRIADA",
          detail: "Dados fictícios carregados no localStorage."
        }
      ])
    );
  }
  const session = getSession();
  if (session) {
    const full = USERS.find((u) => u.email === session.email);
    if (full) {
      saveSession(full);
      showApp(getSession());
    } else {
      localStorage.removeItem(STORAGE_KEYS.session);
      showLogin();
    }
  } else {
    showLogin();
  }
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  login(document.querySelector("#email").value.trim(), document.querySelector("#password").value);
});
occurrenceForm.addEventListener("submit", createOccurrence);
logoutBtn.addEventListener("click", logout);
exportBtn.addEventListener("click", exportEverything);
clearLogsBtn.addEventListener("click", clearLogs);
resetBtn.addEventListener("click", resetData);
function bindSearchListeners() {
  const el = document.getElementById("occurrenceSearchInput");
  if (!el) {
    return;
  }
  const run = () => render();
  ["input", "change", "keyup", "search", "paste", "cut", "compositionend"].forEach((evt) => {
    el.addEventListener(evt, run);
  });
}

bindSearchListeners();
occurrencesTable.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) {
    return;
  }
  const id = btn.getAttribute("data-id");
  const action = btn.getAttribute("data-action");
  if (action === "delete" && id) {
    deleteOccurrence(id);
  }
  if (action === "status" && id) {
    const status = btn.getAttribute("data-status");
    if (status) {
      changeStatus(id, status);
    }
  }
});

boot();

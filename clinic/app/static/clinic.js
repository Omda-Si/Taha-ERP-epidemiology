let meta = null;

function optionHtml(value, label) {
  return `<option value="${value}">${label}</option>`;
}

async function loadMeta() {
  meta = await (await fetch("/api/meta")).json();
  document.getElementById("facilityName").textContent = meta.facility_name;
  document.getElementById("facilityMeta").textContent =
    `${meta.facility_code} · ${meta.city}, ${meta.region} · sync target ${meta.central_api_url}`;
  document.getElementById("occupation").innerHTML = meta.occupations.map((item) => optionHtml(item, item)).join("");
  document.getElementById("cityKey").innerHTML = meta.cities
    .map((item, index) => optionHtml(index, `${item.city} / ${item.region}`))
    .join("");
  document.getElementById("disease").innerHTML = meta.diseases
    .map((item) => optionHtml(`${item.code}|${item.name}`, `${item.name} (${item.code})`))
    .join("");
}

async function loadPatients() {
  const patients = await (await fetch("/api/patients")).json();
  document.getElementById("patientSelect").innerHTML = patients
    .map((patient) => optionHtml(patient.id, `${patient.full_name} · ${patient.occupation}`))
    .join("");
}

async function loadQueue() {
  const items = await (await fetch("/api/queue")).json();
  const pending = items.filter((item) => item.status !== "synced").length;
  document.getElementById("syncStatus").textContent = pending
    ? `${pending} waiting to sync`
    : "All records synced";
  document.getElementById("queueBody").innerHTML = items.map((item) => `
    <tr>
      <td><span class="badge ${item.status}">${item.status}</span></td>
      <td>${item.payload.diagnosis_name}</td>
      <td>${item.payload.age_bracket}</td>
      <td>${item.payload.occupation}</td>
      <td>${item.payload.city}, ${item.payload.region}</td>
      <td>${item.attempts}${item.last_error ? ` · ${item.last_error}` : ""}</td>
    </tr>
  `).join("") || `<tr><td colspan="6">No diagnoses queued yet.</td></tr>`;
}

document.getElementById("patientForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const city = meta.cities[Number(form.get("cityKey"))];
  const payload = Object.fromEntries(form.entries());
  delete payload.cityKey;
  Object.assign(payload, city);
  const response = await fetch("/api/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    alert("Could not save patient");
    return;
  }
  event.target.reset();
  await loadPatients();
});

document.getElementById("diagnosisForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const [diagnosis_code, diagnosis_name] = String(form.get("disease")).split("|");
  const response = await fetch("/api/diagnoses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_id: Number(form.get("patient_id")),
      diagnosis_code,
      diagnosis_name,
      clinical_notes: form.get("clinical_notes") || null,
    }),
  });
  const data = await response.json();
  const box = document.getElementById("lastPayload");
  box.classList.remove("hidden");
  box.textContent = JSON.stringify(data.queued_payload, null, 2);
  await loadQueue();
});

document.getElementById("flushBtn").addEventListener("click", async () => {
  await fetch("/api/queue/flush", { method: "POST" });
  await loadQueue();
});

async function boot() {
  await loadMeta();
  await loadPatients();
  await loadQueue();
  setInterval(async () => {
    await fetch("/api/queue/flush", { method: "POST" });
    await loadQueue();
  }, 8000);
}

boot();

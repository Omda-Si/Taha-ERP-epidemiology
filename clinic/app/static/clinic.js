let meta = null;

function optionHtml(value, label) {
  return `<option value="${value}">${label}</option>`;
}

function showPage(name) {
  document.querySelectorAll(".page").forEach((page) => page.classList.toggle("active", page.id === `page-${name}`));
  document.querySelectorAll(".nav").forEach((button) => button.classList.toggle("active", button.dataset.page === name));
  const titles = {
    home: "Dashboard",
    patients: "Patients",
    appointments: "Appointments",
    diagnoses: "Diagnoses",
    billing: "Billing",
    prescriptions: "Prescriptions",
    sync: "HQ sync",
  };
  document.getElementById("pageTitle").textContent = titles[name] || name;
}

async function loadMeta() {
  meta = await (await fetch("/api/meta")).json();
  document.getElementById("facilityName").textContent = meta.facility_name;
  document.getElementById("facilityMeta").textContent =
    `${meta.facility_code} · ${meta.city}, ${meta.region} · HQ ${meta.central_api_url}`;
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
  const options = patients.map((patient) => optionHtml(patient.id, patient.full_name)).join("");
  document.querySelectorAll(".patient-select").forEach((select) => {
    select.innerHTML = options;
  });
  document.getElementById("patientTable").innerHTML = patients.map((patient) => `
    <tr>
      <td>${patient.full_name}</td>
      <td>${patient.phone || ""}</td>
      <td>${patient.occupation}</td>
      <td>${patient.city}</td>
    </tr>
  `).join("") || `<tr><td colspan="4">No patients yet.</td></tr>`;
}

async function loadDoctors() {
  const doctors = await (await fetch("/api/doctors")).json();
  document.getElementById("doctorSelect").innerHTML = doctors
    .map((doctor) => optionHtml(doctor.id, `${doctor.name} · ${doctor.specialty}`))
    .join("");
}

async function loadAppointments() {
  const rows = await (await fetch("/api/appointments")).json();
  document.getElementById("appointmentTable").innerHTML = rows.map((row) => `
    <tr>
      <td>${row.scheduled_at}</td>
      <td>${row.patient_name}</td>
      <td>${row.doctor_name}</td>
      <td>${row.visit_type}</td>
      <td>${row.consultation_fee}</td>
      <td><span class="badge ${row.payment_state}">${row.payment_state}</span></td>
    </tr>
  `).join("") || `<tr><td colspan="6">No appointments yet.</td></tr>`;
  document.getElementById("billingTable").innerHTML = rows.map((row) => `
    <tr>
      <td>${row.patient_name}</td>
      <td>${row.doctor_name}</td>
      <td>${row.consultation_fee}</td>
      <td><span class="badge ${row.payment_state}">${row.payment_state}</span></td>
      <td>${row.payment_state === "unpaid" ? `<button class="ghost pay" data-id="${row.id}">Mark paid</button>` : ""}</td>
    </tr>
  `).join("") || `<tr><td colspan="5">No invoices yet.</td></tr>`;
}

async function loadPrescriptions() {
  const rows = await (await fetch("/api/prescriptions")).json();
  document.getElementById("prescriptionTable").innerHTML = rows.map((row) => `
    <tr>
      <td>${row.patient_name}</td>
      <td>${row.medication}</td>
      <td>${row.dose}</td>
      <td>${row.created_at}</td>
    </tr>
  `).join("") || `<tr><td colspan="4">No prescriptions yet.</td></tr>`;
}

async function loadDashboard() {
  const data = await (await fetch("/api/dashboard")).json();
  document.getElementById("dashCards").innerHTML = `
    <div class="card">Patients<strong>${data.patients}</strong></div>
    <div class="card">Appointments<strong>${data.appointments}</strong></div>
    <div class="card">Diagnoses<strong>${data.diagnoses}</strong></div>
    <div class="card">Unpaid / queue<strong>${data.unpaid} / ${data.queue_pending}</strong></div>
  `;
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

document.querySelectorAll(".nav").forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

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
  await loadDashboard();
});

document.getElementById("appointmentForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const response = await fetch("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_id: Number(form.get("patient_id")),
      doctor_id: Number(form.get("doctor_id")),
      scheduled_at: form.get("scheduled_at"),
      visit_type: form.get("visit_type"),
      chief_complaint: form.get("chief_complaint") || null,
    }),
  });
  if (!response.ok) {
    alert("Could not save appointment");
    return;
  }
  event.target.reset();
  await loadAppointments();
  await loadDashboard();
});

document.getElementById("billingTable").addEventListener("click", async (event) => {
  const button = event.target.closest(".pay");
  if (!button) return;
  await fetch(`/api/appointments/${button.dataset.id}/pay`, { method: "POST" });
  await loadAppointments();
  await loadDashboard();
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
  await loadDashboard();
});

document.getElementById("prescriptionForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  const response = await fetch("/api/prescriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_id: Number(form.get("patient_id")),
      medication: form.get("medication"),
      dose: form.get("dose"),
      instructions: form.get("instructions") || null,
    }),
  });
  if (!response.ok) {
    alert("Could not save prescription");
    return;
  }
  event.target.reset();
  await loadPrescriptions();
});

document.getElementById("flushBtn").addEventListener("click", async () => {
  await fetch("/api/queue/flush", { method: "POST" });
  await loadQueue();
  await loadDashboard();
});

async function boot() {
  await loadMeta();
  await loadPatients();
  await loadDoctors();
  await loadAppointments();
  await loadPrescriptions();
  await loadQueue();
  await loadDashboard();
  setInterval(async () => {
    await fetch("/api/queue/flush", { method: "POST" });
    await loadQueue();
    await loadDashboard();
  }, 8000);
}

boot();

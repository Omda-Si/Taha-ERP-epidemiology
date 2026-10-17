const charts = {};

function chartColors() {
  return ["#3ecf8e", "#5b8cff", "#f5c15c", "#67d5ff", "#ff6b7a", "#b794f4", "#86efac", "#f9a8d4"];
}

function upsertChart(id, type, labels, values, extra = {}) {
  const ctx = document.getElementById(id);
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: type === "line" ? "rgba(62, 207, 142, 0.18)" : chartColors(),
        borderColor: "#3ecf8e",
        borderWidth: type === "line" ? 2 : 0,
        fill: type === "line",
        tension: 0.35,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: type === "doughnut" ? {} : {
        x: { ticks: { color: "#8aa0b8" }, grid: { color: "rgba(255,255,255,0.04)" } },
        y: { ticks: { color: "#8aa0b8" }, grid: { color: "rgba(255,255,255,0.06)" } },
      },
      ...extra,
    },
  });
}

function renderKpis(kpis) {
  const items = [
    ["Total events", kpis.total_events],
    ["In window", kpis.window_events],
    ["Diseases", kpis.diseases],
    ["Regions", kpis.regions],
    ["Facilities", kpis.facilities],
    ["Active alerts", kpis.active_alerts],
  ];
  document.getElementById("kpis").innerHTML = items.map(([label, value]) => `
    <div class="kpi"><span>${label}</span><strong>${value}</strong></div>
  `).join("");
}

function renderAlerts(alerts) {
  const root = document.getElementById("alerts");
  if (!alerts.length) {
    root.innerHTML = `<div class="alert"><b>No outbreak alerts in this window</b><span>Spike detection compares the last 7 days against the prior 7 days by disease and region.</span></div>`;
    return;
  }
  root.innerHTML = alerts.map((alert) => `
    <div class="alert ${alert.severity}">
      <b>${alert.diagnosis_name} spike in ${alert.region}</b>
      <span>${alert.last_7_days} cases in the last 7 days vs ${alert.previous_7_days} in the previous week.</span>
    </div>
  `).join("");
}

function series(rows) {
  return {
    labels: rows.map((row) => row.label || "Unknown"),
    values: rows.map((row) => row.count),
  };
}

async function loadDashboard() {
  const days = document.getElementById("window").value;
  const response = await fetch(`/api/v1/epidemiology/analytics?days=${days}`);
  const data = await response.json();
  renderKpis(data.kpis);
  renderAlerts(data.alerts);

  const trend = series(data.by_day);
  upsertChart("trendChart", "line", trend.labels, trend.values);
  const disease = series(data.by_disease.slice(0, 8));
  upsertChart("diseaseChart", "bar", disease.labels, disease.values);
  const region = series(data.by_region);
  upsertChart("regionChart", "doughnut", region.labels, region.values);
  const age = series(data.by_age_bracket);
  upsertChart("ageChart", "bar", age.labels, age.values);
  const occupation = series(data.by_occupation.slice(0, 8));
  upsertChart("occupationChart", "bar", occupation.labels, occupation.values, { indexAxis: "y" });

  document.getElementById("events").innerHTML = data.latest.map((event) => `
    <tr>
      <td>${new Date(event.diagnosed_at).toLocaleString()}</td>
      <td>${event.facility_code}</td>
      <td>${event.diagnosis_name} <small>(${event.diagnosis_code})</small></td>
      <td>${event.age_bracket}</td>
      <td>${event.occupation}</td>
      <td>${event.city}, ${event.region}</td>
    </tr>
  `).join("");
}

document.getElementById("window").addEventListener("change", loadDashboard);
loadDashboard();
setInterval(loadDashboard, 20000);

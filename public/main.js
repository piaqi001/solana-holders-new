
async function handleQuery() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("result").innerHTML = "";
  document.getElementById("overlapStats").innerHTML = "";

  const inputs = Array.from(document.querySelectorAll("input")).map(i => i.value.trim()).filter(i => i);
  const tokenData = [];

  for (const token of inputs) {
    const res = await fetch(`/api/holders?token=${token}`);
    const data = await res.json();
    if (!Array.isArray(data)) {
      alert("查询失败或数据格式不正确");
      continue;
    }
    tokenData.push({ token, holders: data });
  }

  document.getElementById("loading").style.display = "none";
  renderTables(tokenData);
  calculateOverlap(tokenData);
}

function renderTables(tokenData) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = tokenData.map((td, idx) => {
    return `
      <div class="token-column">
        <h3>${td.token.slice(0, 4)}</h3>
        <table>
          <thead><tr><th>地址</th><th>持仓</th></tr></thead>
          <tbody>
            ${td.holders.map(h => {
              const name = addressRemarks[h.wallet] || h.wallet;
              const percent = h.percent?.toFixed(4) || "0.0000";
              const repeatCount = tokenData.filter(d => d.holders.find(x => x.wallet === h.wallet)).length;
              const colorClass = repeatCount === 2 ? "color-2" : repeatCount >= 3 ? "color-3" : "color-1";
              return `<tr><td class="${colorClass}"><a href="https://solscan.io/account/${h.wallet}" target="_blank">${name}</a></td><td>${percent}%</td></tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }).join("");
  document.getElementById("timestamp").innerText = "查询时间：" + new Date().toLocaleString();
}

function calculateOverlap(tokenData) {
  if (tokenData.length < 2) return;

  const mapList = tokenData.map(d => new Map(d.holders.map(h => [h.wallet, h])));
  const allAddresses = [...new Set(mapList.flatMap(m => Array.from(m.keys())))];
  const overlapData = allAddresses.map(addr => {
    const appearsIn = mapList.map(m => m.get(addr)).map(Boolean);
    const count = appearsIn.filter(Boolean).length;
    const percents = mapList.map(m => (m.get(addr)?.percent || 0));
    return { addr, count, percents };
  }).filter(o => o.count >= 2);

  const htmlRows = overlapData.map((o, i) => {
    const name = addressRemarks[o.addr] || o.addr;
    const colorClass = o.count === 2 ? "color-2" : "color-3";
    const percentCells = o.percents.map(p => `<td>${p.toFixed(4)}%</td>`).join("");
    return `<tr><td>${i + 1}</td><td class="${colorClass}"><a href="https://solscan.io/account/${o.addr}" target="_blank">${name}</a></td>${percentCells}</tr>`;
  }).join("");

  const header = `<tr><th>#</th><th>地址</th>${tokenData.map(t => `<th>${t.token.slice(0,4)}%</th>`).join("")}</tr>`;
  document.getElementById("overlapStats").innerHTML = `
    <h3>重叠地址统计（${overlapData.length} 个地址）</h3>
    <table>${header}${htmlRows}</table>
  `;
}

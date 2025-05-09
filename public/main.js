let allData = []; // 用于导出 CSV

async function handleQuery() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("results").innerHTML = "";
  document.getElementById("overlap-container").innerHTML = "";
  document.getElementById("timestamp").innerText = "";
  allData = [];

  const inputs = ["token1", "token2", "token3"]
    .map(id => document.getElementById(id).value.trim())
    .filter(s => s.length > 0);

  if (inputs.length < 2) {
    alert("请输入至少两个代币地址进行对比");
    return;
  }

  const tokenData = await Promise.all(inputs.map(async token => {
    const res = await fetch(`/api/holders?token=${token}`);
    const data = await res.json();
    const total = data.reduce((sum, h) => sum + h.amount, 0);
    return {
      name: token,
      holders: data.map(h => ({
        wallet: h.wallet,
        amount: h.amount,
        percent: total > 0 ? (h.amount / total * 100) : 0
      }))
    };
  }));

  allData = tokenData;
  renderResults(tokenData);
  showOverlap(tokenData);

  const now = new Date();
  document.getElementById("timestamp").innerText = `查询时间：${now.toLocaleString()}`;
  document.getElementById("loading").style.display = "none";
}

function renderResults(data) {
  const container = document.getElementById("results");
  container.innerHTML = data.map(token => {
    const rows = token.holders.map((h, i) => {
      const name = addressRemarks[h.wallet] || h.wallet;
      return `<tr><td>${i + 1}</td><td><a href="https://solscan.io/account/${h.wallet}" target="_blank">${name}</a></td><td>${h.amount.toFixed(2)}</td><td>${h.percent.toFixed(4)}%</td></tr>`;
    }).join("");
    return `<div class="token-column"><h3>${token.name}</h3><table><tr><th>#</th><th>地址</th><th>数量</th><th>百分比</th></tr>${rows}</table></div>`;
  }).join("");
}

function showOverlap(data) {
  const counts = {};
  const holdersMap = {};

  data.forEach((token, i) => {
    token.holders.forEach(h => {
      counts[h.wallet] = (counts[h.wallet] || 0) + 1;
      if (!holdersMap[h.wallet]) holdersMap[h.wallet] = {};
      holdersMap[h.wallet][i] = h;
    });
  });

  const overlaps = Object.keys(counts)
    .filter(addr => counts[addr] >= 2)
    .map(addr => {
      const remark = addressRemarks[addr] || addr;
      const totalPercent = Object.values(holdersMap[addr]).reduce((sum, h) => sum + h.percent, 0);
      return {
        wallet: addr,
        remark,
        percent: totalPercent,
        count: counts[addr]
      };
    });

  overlaps.sort((a, b) => b.percent - a.percent);

  const rows = overlaps.map((o, i) => {
    const colorClass = o.count === 2 ? "color-2" : "color-3";
    return `<tr class="${colorClass}"><td>${i + 1}</td><td><a href="https://solscan.io/account/${o.wallet}" target="_blank">${o.remark}</a></td><td>${o.percent.toFixed(4)}%</td></tr>`;
  }).join("");

  const sum = overlaps.reduce((acc, o) => acc + o.percent, 0).toFixed(4);
  document.getElementById("overlap-container").innerHTML = `
    <h3>地址重叠率统计</h3>
    <p>重叠率总和：${sum}%</p>
    <table><tr><th>#</th><th>地址</th><th>总百分比</th></tr>${rows}</table>
  `;
}

function exportCSV() {
  if (allData.length === 0) return alert("请先查询代币");
  const rows = [["Token", "Wallet", "Amount", "Percent"]];
  allData.forEach(token => {
    token.holders.forEach(h => {
      const name = addressRemarks[h.wallet] || h.wallet;
      rows.push([token.name, name, h.amount, h.percent.toFixed(4)]);
    });
  });
  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", "holders.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

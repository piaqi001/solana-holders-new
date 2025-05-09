async function handleQuery() {
  const tokens = [token1.value, token2.value, token3.value].map(x => x.trim()).filter(x => x);
  if (tokens.length < 2) {
    alert("请至少输入两个代币地址");
    return;
  }
  document.getElementById("loading").style.display = "block";
  document.getElementById("results").innerHTML = "";
  document.getElementById("overlap-container").innerHTML = "";
  document.getElementById("timestamp").innerText = "";

  try {
    const allHolders = await Promise.all(tokens.map(t =>
      fetch(`/api/holders?token=${t}`).then(res => res.json())
    ));

    const totalByToken = allHolders.map(list => list.reduce((sum, h) => sum + h.amount, 0));
    const holdersWithPercent = allHolders.map((list, idx) =>
      list.map((h, i) => ({
        wallet: h.wallet,
        amount: h.amount,
        percent: +(100 * h.amount / totalByToken[idx]).toFixed(4)
      }))
    );

    const resultsHTML = holdersWithPercent.map((list, idx) => {
      return `<div class="token-column"><h3>第 ${idx + 1} 个代币</h3>
        <table><tr><th>#</th><th>地址</th><th>数量</th><th>百分比</th></tr>` +
        list.map((h, i) => `<tr><td>${i + 1}</td><td>${h.wallet}</td><td>${h.amount.toLocaleString()}</td><td>${h.percent.toFixed(4)}%</td></tr>`).join("") +
        `</table></div>`;
    }).join("");
    document.getElementById("results").innerHTML = resultsHTML;

    showOverlap(holdersWithPercent, tokens);
    document.getElementById("timestamp").innerText = "查询时间：" + new Date().toLocaleString();
  } catch (e) {
    alert("请检查代币地址是否正确。");
  }
  document.getElementById("loading").style.display = "none";
}

function showOverlap(holdersWithPercent, tokens) {
  const counts = {};
  holdersWithPercent.forEach(list => {
    list.forEach(({ wallet }) => {
      counts[wallet] = (counts[wallet] || 0) + 1;
    });
  });

  const overlapWallets = Object.entries(counts).filter(([, c]) => c >= 2).map(([wallet]) => wallet);
  const header = `<h3>重叠地址 (${overlapWallets.length})</h3><table><tr><th>#</th><th>地址</th>` +
    tokens.map((_, i) => `<th>代币${i + 1}占比</th>`).join("") +
    `<th>出现次数</th></tr>`;

  const rows = overlapWallets.map((wallet, idx) => {
    const percents = holdersWithPercent.map(list => {
      const match = list.find(h => h.wallet === wallet);
      return match ? `${match.percent.toFixed(4)}%` : "-";
    });
    return `<tr><td>${idx + 1}</td><td>${wallet}</td>${percents.map(p => `<td>${p}</td>`).join("")}<td>${counts[wallet]}</td></tr>`;
  }).join("");

  document.getElementById("overlap-container").innerHTML = header + rows + "</table>";
}

function exportCSV() {
  const csv = [];
  document.querySelectorAll("table").forEach(table => {
    Array.from(table.rows).forEach(row => {
      const cols = Array.from(row.cells).map(cell => `"${cell.innerText.replace(/"/g, '""')}"`);
      csv.push(cols.join(","));
    });
    csv.push("");
  });

  const blob = new Blob(["﻿" + csv.join("
")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "solana-holders.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

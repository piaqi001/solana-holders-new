// main.js

async function handleQuery() {
  const tokenInputs = [...document.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);
  const resultsDiv = document.getElementById("results");
  const loadingDiv = document.getElementById("loading");
  const timestampDiv = document.getElementById("timestamp");
  const overlapContainer = document.getElementById("overlap-container");

  resultsDiv.innerHTML = "";
  overlapContainer.innerHTML = "";
  timestampDiv.innerText = "";
  loadingDiv.style.display = "block";

  try {
    const tokensData = await Promise.all(tokenInputs.map(token =>
      fetch(`/api/holders?token=${token}`).then(res => res.json())
    ));

    tokensData.forEach((holders, i) => {
      const total = holders.reduce((acc, cur) => acc + cur.amount, 0);
      tokensData[i] = holders.map((h, idx) => ({
        ...h,
        index: idx + 1,
        percent: ((h.amount / total) * 100).toFixed(4)
      }));
    });

    const resultsHTML = tokensData.map((holders, i) => {
      const tokenName = tokenInputs[i];
      return `<div class="token-column"><h3>${tokenName}</h3>
        <table><tr><th>#</th><th>地址</th><th>持仓%</th></tr>
        ${holders.map(h => {
          const name = addressRemarks[h.wallet] || h.wallet;
          const colorClass = colorForAddress(h.wallet, tokensData);
          return `<tr class="${colorClass}"><td>${h.index}</td><td>${name}</td><td>${h.percent}%</td></tr>`;
        }).join("")}
        </table></div>`;
    }).join("");

    resultsDiv.innerHTML = resultsHTML;
    timestampDiv.innerText = `查询时间：${new Date().toLocaleString()}`;

    if (tokensData.length > 1) {
      showOverlap(tokensData);
    }
  } catch (e) {
    resultsDiv.innerHTML = '<div class="error">查询失败，请检查代币地址是否正确。</div>';
  } finally {
    loadingDiv.style.display = "none";
  }
}

function colorForAddress(wallet, allTokens) {
  const count = allTokens.filter(list => list.find(h => h.wallet === wallet)).length;
  return count === 3 ? 'color-3' : count === 2 ? 'color-2' : 'color-1';
}

function showOverlap(tokensData) {
  const overlapContainer = document.getElementById("overlap-container");
  const [first, ...rest] = tokensData;
  const overlap = {};

  first.forEach(h => {
    const count = tokensData.reduce((acc, list) => acc + (list.find(x => x.wallet === h.wallet) ? 1 : 0), 0);
    if (count >= 2) {
      const name = addressRemarks[h.wallet] || h.wallet;
      overlap[h.wallet] = { name, count, amount: h.amount, percent: h.percent };
    }
  });

  const rows = Object.entries(overlap).map(([wallet, info], idx) => {
    const colorClass = info.count === 3 ? 'color-3' : info.count === 2 ? 'color-2' : 'color-1';
    return `<tr class="${colorClass}"><td>${idx + 1}</td><td>${info.name}</td><td>${info.percent}%</td></tr>`;
  });

  if (rows.length > 0) {
    const sum = Object.values(overlap).reduce((acc, cur) => acc + parseFloat(cur.percent), 0).toFixed(4);
    overlapContainer.innerHTML = `
      <h3>重叠地址统计</h3>
      <table>
        <tr><th>#</th><th>地址</th><th>总持仓%</th></tr>
        ${rows.join("")}
        <tr><td colspan="2">重叠地址总持仓</td><td>${sum}%</td></tr>
      </table>`;
  }
}

function exportCSV() {
  const rows = [...document.querySelectorAll("table")].flatMap(table =>
    [...table.rows].map(row =>
      [...row.cells].map(cell => cell.innerText).join(",")
    )
  );

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "solana-holders.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


async function fetchHolders(token) {
    const res = await fetch(`/api/holders.js?token=${token}`);
    const data = await res.json();
    return data;
}

function getColorClass(address, matchCount) {
    if (matchCount === 1) return 'color-black';
    if (matchCount === 2) return 'color-blue';
    return 'color-red';
}

function calculateOverlap(holderMaps) {
    const allAddresses = new Set();
    holderMaps.forEach(map => map.forEach((_, key) => allAddresses.add(key)));
    const overlapCounts = {};
    allAddresses.forEach(addr => {
        let count = 0;
        holderMaps.forEach(map => { if (map.has(addr)) count++; });
        overlapCounts[addr] = count;
    });
    return overlapCounts;
}

async function handleQuery() {
    document.getElementById("loading").style.display = "block";
    document.getElementById("results").innerHTML = "";
    document.getElementById("overlap-container").innerHTML = "";
    const token1 = document.getElementById("token1").value.trim();
    const token2 = document.getElementById("token2").value.trim();
    const token3 = document.getElementById("token3").value.trim();
    const tokens = [token1, token2, token3].filter(t => t !== "");

    const results = await Promise.all(tokens.map(fetchHolders));
    const maps = results.map(res => new Map(res.map(i => [i.address, i.amount])));
    const overlaps = calculateOverlap(maps);

    const resultContainer = document.getElementById("results");
    maps.forEach((map, idx) => {
        const div = document.createElement("div");
        div.className = "token-column";
        div.innerHTML = `<h3>Token ${idx + 1}</h3>`;
        let total = 0;
        map.forEach(v => total += v);
        map.forEach((amount, address) => {
            const perc = ((amount / total) * 100).toFixed(2);
            const matchCount = overlaps[address];
            const span = document.createElement("div");
            span.className = "address";
            span.style.color = matchCount === 1 ? 'black' : matchCount === 2 ? 'blue' : 'red';
            span.textContent = `${address} (${perc}%)`;
            div.appendChild(span);
        });
        resultContainer.appendChild(div);
    });

    const overlapStats = {};
    Object.values(overlaps).forEach(count => {
        overlapStats[count] = (overlapStats[count] || 0) + 1;
    });
    const statsDiv = document.getElementById("overlap-container");
    statsDiv.innerHTML = "<h3>地址重叠统计</h3>";
    Object.entries(overlapStats).forEach(([k, v]) => {
        statsDiv.innerHTML += `<div>${k}个代币中出现的地址数: ${v}</div>`;
    });

    document.getElementById("timestamp").textContent = "最后更新时间: " + new Date().toLocaleString();
    document.getElementById("loading").style.display = "none";
}

function exportCSV() {
    let csv = "地址,Token Index,持仓百分比\n";
    const columns = document.querySelectorAll(".token-column");
    columns.forEach((col, idx) => {
        const divs = col.querySelectorAll(".address");
        divs.forEach(d => {
            const [addrPart, percPart] = d.textContent.split(" ");
            const perc = percPart.replace(/[()\%]/g, "");
            csv += `${addrPart},${idx + 1},${perc}\n`;
        });
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "holders.csv";
    a.click();
}

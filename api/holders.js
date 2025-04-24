const axios = require('axios');
const bs58 = require('bs58');

function decodeBase64ToBuffer(str) {
  return Buffer.from(str, 'base64');
}

function readPublicKey(buffer, offset) {
  return bs58.encode(buffer.slice(offset, offset + 32));
}

function readAmount(buffer, offset) {
  return buffer.readBigUInt64LE(offset);
}

module.exports = async (req, res) => {
  const tokenMint = req.query.token;
  if (!tokenMint) {
    return res.status(400).json({ error: '缺少 token 参数' });
  }

  const rpcUrl = "https://mainnet.helius-rpc.com/?api-key=f9e47385-9354-4ee6-8b39-17cb0326bdc6";

  try {
    const response = await axios.post(rpcUrl, {
      jsonrpc: "2.0",
      id: 1,
      method: "getProgramAccounts",
      params: [
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        {
          encoding: "base64",
          filters: [
            { dataSize: 165 },
            { memcmp: { offset: 0, bytes: tokenMint } }
          ]
        }
      ]
    }, {
      headers: { "Content-Type": "application/json" }
    });

    const accounts = response.data.result;
    if (!accounts || !Array.isArray(accounts)) {
      throw new Error("未能获取持仓数据，可能 token 地址无效或无持仓");
    }

    const parsed = accounts.map(({ account }) => {
      try {
        const [dataBase64] = account.data;
        const buffer = decodeBase64ToBuffer(dataBase64);
        const owner = readPublicKey(buffer, 32);
        const rawAmount = readAmount(buffer, 64);
        return {
          wallet: owner,
          amount: Number(rawAmount) / 1e6
        };
      } catch (err) {
        console.warn("解析失败:", err);
        return null;
      }
    }).filter(Boolean);

    parsed.sort((a, b) => b.amount - a.amount);
    const total = parsed.reduce((sum, acc) => sum + acc.amount, 0);
const top400 = parsed.slice(0, 400).map(acc => ({
  ...acc,
  percent: total > 0 ? (acc.amount / total) * 100 : 0
}));

    res.status(200).json(top400);
  } catch (err) {
    console.error("查询失败:", err.response?.data || err.message);
    res.status(500).json({
      error: "查询失败",
      detail: err.response?.data || err.message
    });
  }
};

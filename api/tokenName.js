const axios = require("axios");

module.exports = async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ error: "缺少 token 参数" });
  }

  try {
    const response = await axios.get("https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json");
    const tokens = response.data?.tokens || [];

    const found = tokens.find(t => String(t.address) === String(token));
    const name = found?.name || "未知代币";

    res.status(200).json({ name });
  } catch (err) {
    console.error("获取代币名称失败：", err.message || err);
    res.status(500).json({ error: "请求失败", detail: err.message || err });
  }
};

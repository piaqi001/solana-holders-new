const axios = require("axios");

module.exports = async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ error: "缺少 token 参数" });
  }

  try {
    const tokenListRes = await axios.get("https://token-list-api.solana.cloud/v1/tokens");
    const tokens = tokenListRes.data.tokens;

    const found = tokens.find(t => t.address === token);
    const name = found?.name || "未知代币";

    res.status(200).json({ name });
  } catch (err) {
    console.error("查询代币名称失败：", err.message || err);
    res.status(500).json({ error: "查询失败", detail: err.message || err });
  }
};

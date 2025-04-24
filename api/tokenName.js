const axios = require("axios");

module.exports = async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(400).json({ error: "缺少 token 参数" });
  }

  try {
    const response = await axios.post(
      "https://api.helius.xyz/v0/token-metadata?api-key=f9e47385-9354-4ee6-8b39-17cb0326bdc6",
      { mintAccounts: [token] },
      { headers: { "Content-Type": "application/json" } }
    );

    const metadata = response.data?.[0];
    const name = metadata?.name || "未知代币";

    res.status(200).json({ name });
  } catch (err) {
    console.error("获取代币名称失败：", err.message || err);
    res.status(500).json({ error: "请求失败", detail: err.message || err });
  }
};

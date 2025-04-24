const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { token } = req.query;

  try {
    const tokenListRes = await fetch('https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json');
    const tokenList = await tokenListRes.json();
    const tokens = tokenList.tokens;

    const found = tokens.find(t => t.address.toLowerCase() === token.toLowerCase());

    if (found) {
      res.status(200).json({ name: found.name });
    } else {
      res.status(200).json({ name: '未知代币' });
    }
  } catch (e) {
    res.status(500).json({ error: '请求失败', detail: e.message });
  }
};

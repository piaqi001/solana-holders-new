export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token address is required' });
  }

  try {
    const response = await fetch('https://token.jup.ag/all');
    const tokens = await response.json();
    const found = tokens.find(t => t.address.toLowerCase() === token.toLowerCase());

    if (found) {
      res.status(200).json({
        name: found.name,
        symbol: found.symbol,
        logoURI: found.logoURI
      });
    } else {
      res.status(200).json({ name: '未知代币' });
    }
  } catch (error) {
    res.status(500).json({ error: '无法获取代币名称', detail: error.message });
  }
}
export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token address is required' });
  }

  try {
    const trimmedToken = token.trim();
    console.log('收到的 token 参数:', token);
    console.log('去除空格后 token:', trimmedToken);

    const response = await fetch('https://cdn.jsdelivr.net/gh/jup-ag/token-list@main/src/tokens/solana.tokenlist.json');
    const data = await response.json();
    const tokens = data.tokens;

    console.log('Jupiter CDN token list 长度:', tokens.length);
    console.log('前5个地址预览:', tokens.slice(0, 5).map(t => t.address));

    const found = tokens.find(t => t.address === trimmedToken);
    console.log('是否找到匹配:', found);

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
    console.error('错误详情:', error);
    res.status(500).json({ error: '无法获取代币名称', detail: error.message });
  }
}

module.exports = (req, res) => {
  res.status(200).json([
    { wallet: "ExampleWallet111111111111111111111111111111", amount: 123456.78 },
    { wallet: "ExampleWallet222222222222222222222222222222", amount: 987654.32 }
  ]);
};
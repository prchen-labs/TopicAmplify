const Search = require('../Models/search');

// 渲染搜尋頁面
exports.searchPage = (req, res) => {
  res.render('search');
};

// 處理搜尋请求
exports.search = async (req, res) => {
  const query = req.body.query;
  const results = await Search.find({ text: { $regex: query, $options: 'i' } });
  res.render('searchResults', { results });
};
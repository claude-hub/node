const hifini = require('./hifini');

const queryMusic = async (query) => {
  return await hifini(query);
};

module.exports = queryMusic, {
  hifini,
};

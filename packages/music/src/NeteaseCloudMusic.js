const request = require('../utils/request');

const artists = async () => {
  const data = {
    limit: 100,
    offset: 0,
    total: true,
  };
  const result = await request(
    'POST',
    `https://music.163.com/weapi/artist/top`,
    data,
    {
      crypto: 'weapi',
    }
  );
  const a = result.body.artists.length;
  console.log(a);

  console.log(JSON.stringify(result.body.artists));
};

artists();

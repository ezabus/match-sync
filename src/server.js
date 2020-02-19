const express = require('express');
const matchSync = require('./matchSync');

const app = express();

app.get('/', async (req, res) => {
  try {
    await matchSync.syncIfRequired();
    res.send('Synced');
  } catch (err) {
    res.status(500).send(err);
  }
});

app.get('/syncRound', async (req, res) => {
  const { round } = req.query;
  try {
    await matchSync.sync(round);
    res.send('Synced');
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(4004, () => {
  console.log('Data sync service started at 4004');
});

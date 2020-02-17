const express = require('express');
const matchSync = require('./matchSync');

const app = express();

app.get('/', async (req, res) => {
  try {
    await matchSync.syncIfRequired();
  } catch (err) {
    res.status(500).send(err);
  }
  res.send('Synced');
});

app.get('/syncRound', async (req, res) => {
  const { round } = req.query;
  try {
    await matchSync.sync(round);
    
  } catch (err) {
    res.status(500).send(err);
  }
  res.send('Synced');
});

app.listen(4004, () => {
  console.log('Data sync service started at 4004');
});

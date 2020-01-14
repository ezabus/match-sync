
const axios = require('axios');

async function loadRoundData(teamId, roundId) {
  const url = getLineupUrl(teamId, roundId);
  const response = await axios(url);
  return response.data;
}

function getLineupUrl(teamId, roundId) {
  const zeroRoundUrlSegment = 9622;
  const roundUrlSegment = zeroRoundUrlSegment + parseInt(roundId, 10);
  const url = `https://www.sports.ru/fantasy/football/team/points/${teamId}/${roundUrlSegment}.json`;
  return url;
}

module.exports = {
  loadRoundData
};

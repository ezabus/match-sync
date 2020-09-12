const PlayerResult = require('./PlayerResult');
const Lineup = require('./Lineup');
const sportsRuLineupLoader = require('./sportsRuLineupLoader');

async function getLineup(teamId, roundId, season) {
  const playerResults = await getPlayersResults(teamId, roundId, season);
  const lineup = new Lineup(playerResults);
  return lineup;
}

async function getPlayersResults(teamId, roundId, season) {
  const roundData = await sportsRuLineupLoader.loadRoundData(teamId, roundId);
  const playersResultsData = roundData.players;
  const playerResults = playersResultsData.map((data) => {
    const playerResult = new PlayerResult({
      teamId,
      round: roundId
    });
    const dataWithSeason = {...data, season: season}
    playerResult.fromSportsRu(dataWithSeason);
    return playerResult;
  });
  return playerResults;
}

module.exports = getLineup;

const {
  Pool
} = require('pg');

const pool = new Pool();


class Match {
  constructor(settings) {
    this.homeTeamId = settings.homeTeamId;
    this.awayTeamId = settings.awayTeamId;
    this.round = settings.round;
    this.setHomeLineup(settings.homeLineup);
    this.setAwayLineup(settings.awayLineup);
  }

  setHomeLineup(homeLineup) {
    this.homeLineup = homeLineup || [];
  }

  setAwayLineup(awayLineup) {
    this.awayLineup = awayLineup || [];
  }

  async saveResults() {
    const updateMatchResults = `
            UPDATE epl.matches
            SET home_points = $1, away_points = $2
            WHERE home_team_id = $3 and away_team_id = $4 and round = $5;`;
    await pool.query(updateMatchResults, [
      this.homeLineup.getPointsCount(),
      this.awayLineup.getPointsCount(),
      this.homeTeamId,
      this.awayTeamId,
      this.round]);
    await this.homeLineup.save();
    await this.awayLineup.save();
  }
}

module.exports = Match;

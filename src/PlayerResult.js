const {
  Pool
} = require('pg');

const pool = new Pool();

class PlayerResult {
  constructor(settings) {
    const settingsCopy = { ...settings };
    this._position = settingsCopy.amplua ? settingsCopy.amplua : null;
    this._hasPlayed = settingsCopy.hasPlayed ? settingsCopy.hasPlayed : null;
    this._points = settingsCopy.points ? settingsCopy.points : 0;
    this._teamId = settings.teamId;
    this._playerId = settings.playerId;
    this._round = settings.round;
  }

  fromSportsRu(data) {
    this._season = data.season;
    this._playerId = data.tag_id;
    this._playerName = data.name;
    this._clubId = data.club_id;
    this._isCaptain = data.isCaptain;
    this._position = data.amplua;
    this._price = data.price;
    this._hasPlayed = data.points !== '-';
    this._isStarter = data.order === '0';
    this._goals = isNaN(parseInt(data.goals)) ? 0 : parseInt(data.goals);
    this._pass = isNaN(parseInt(data.pass)) ? 0 : parseInt(data.pass);
    if (!this._isStarter) {
      this._benchOrder = parseInt(data.order, 10);
    }
    if (this.hasPlayed()) {
      this._points = data.points ? data.points : this._points;
    }
    this._isCounted = this.hasPlayed() && this.isStarter();
  }

  isCounted() {
    return this._isCounted;
  }

  getPoints() {
    return this._points;
  }

  isStarter() {
    return this._isStarter;
  }

  hasPlayed() {
    return this._hasPlayed;
  }

  getBenchOrder() {
    return this._benchOrder;
  }

  getPosition() {
    return this._position;
  }

  callUp() {
    this._isCounted = this._hasPlayed;
  }

  getPlayerName() {
    return this._playerName;
  }

  async save() {
    const saveChangesQuery = `
        INSERT INTO epl.lineups(team_id, player_id, round, player_name, points, is_starter, is_scratch, is_counted, is_captain, club_id, price, position, goals, passes, season)
            VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (team_id, player_id, round) DO UPDATE
            SET points = $5,
                is_starter = $6,
                is_scratch = $7,
                is_counted = $8,
                is_captain = $9,
                club_id = $10,
                price = $11,
                position = $12,
                goals = $13,
                passes = $14,
                season = $15`;
    const isScratch = !this.hasPlayed();
    return pool.query(saveChangesQuery, [
      this._teamId,
      this._playerId,
      this._round,
      this._playerName,
      this._points,
      this._isStarter,
      isScratch,
      this._isCounted,
      this._isCaptain,
      this._clubId,
      this._price,
      this._position,
      this._goals,
      this._pass,
      this._season
    ]);
  }
}

module.exports = PlayerResult;

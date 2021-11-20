class HandCricketClass {
  
  constructor(toss, choice) {

    if(typeof HandCricketClass.instance === 'object') {
      return HandCricketClass.instance
    }
    this.toss = toss;        //Won or Lost
    this.choice = choice;    //Batting or Bowling
    this.numberOfBalls = 0;
    this.score = 0;
    this.target = 0;
    this.innings = 1;         // 1 or 2
    this.oversFirstInnings = 0;
    this.oversSecondInnings = 0;
  }

  setScore(score) {

    if(score == 0) {
      this.score = 0
      return
    }
    this.score = this.score + score;
    if(this.innings == 1) {
      this.target = this.score;
    }
    this.numberOfBalls = this.numberOfBalls+1
    this.setOvers()
  }

  setNumberOfBalls(balls) {
    this.numberOfBalls = balls
  }

  getTarget() {
    return this.target
  }

  getScore() {
    return this.score
  }

  setInnings(innings) {
    this.innings = innings
  }

  getInnings() {
    return this.innings
  }

  getChoice() {
    return this.choice;
  }

  setOvers() {
    var overs = Math.floor(this.numberOfBalls / 6).toString()+'.'+(this.numberOfBalls % 6).toString();
    if(this.innings == 1) { 
      this.oversFirstInnings = overs
    }
    else {
      this.oversSecondInnings = overs
    }
  }

  getOvers() {
    if(this.innings == 1) {
      return this.oversFirstInnings
    }
    return this.oversSecondInnings
  }
  
}

module.exports = { HandCricketClass }
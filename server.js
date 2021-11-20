const express = require('express');
const { WebhookClient } = require('dialogflow-fulfillment');
const app = express();
var axios = require('axios');

// functions
const welcome = require('./scripts/welcome');
const globalRank = require('./scripts/globalRank');
const teamDetails = require('./scripts/teamDetails');
const matches = require('./scripts/matches');
const venue = require('./scripts/venue');
const playerInfo = require('./scripts/playerInfo');
const headToHead = require('./scripts/headToHead');
const quiz = require('./scripts/quiz');
const latestNews = require('./scripts/latestNews');
const playerRankings = require('./scripts/playerRankings');
const teamHighestAndLowest = require('./scripts/teamHighestLowest');
const playerPerformance = require('./scripts/playerPerformance');
const handCricket = require('./scripts/handCricket');


// default app route
app.get('/', (req, res) => res.send('online'))

// dialogflow app route - this will be called for fulfillment
app.post('/dialogflow', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })

// mapping intents to functions
  let intentMap = new Map()
  intentMap.set('Default Welcome Intent', welcome.welcome);
  intentMap.set('icc-rankings', globalRank.find_ICC_rankings);
  intentMap.set('global_ranking_of_team', globalRank.global_ranking_of_team);
  intentMap.set('global_ranking_of_team - custom', globalRank.global_rank_of_team_in);
  intentMap.set('team_details', teamDetails.team_details);
  intentMap.set('matches_played', matches.matches_played);
  intentMap.set('matches_between_dates', matches.matches_between_dates);
  intentMap.set('venue_details', venue.venue_details);
  intentMap.set('PlayerDetails', playerInfo.fetchPlayerDetails);
  //intentMap.set('PlayerStats', playerInfo.playerStatsGenerateChart);
  intentMap.set('PlayerStats', playerInfo.playerStats);
  intentMap.set('LiveScore', playerInfo.liveScore);
  intentMap.set('Reminder for Upcoming Match', playerInfo.setReminderForMatches)
  intentMap.set('PlayerHeadToHead', playerInfo.playerHeadtoHead);
  intentMap.set('PlayerIndividualStats', playerInfo.getIndividualPlayerStats);
  intentMap.set('PlayerIndividualStats - custom', playerInfo.getIndividualPlayerStatsFollowUp)
  intentMap.set('HeadToHead', headToHead.getHeadToHeadStats);
  intentMap.set('TeamStats', headToHead.getTeamStats);
  intentMap.set('quiz-welcome', quiz.welcome);
  intentMap.set('quiz-welcome - custom', quiz.start);
  intentMap.set('quiz-start', quiz.question);
  intentMap.set('quiz-start - fallback', quiz.repeatQuestion)
  intentMap.set('quiz-start - custom', quiz.checkAns);
  intentMap.set('quiz-completed', quiz.exit);
  intentMap.set('LatestNews', latestNews.getNews);
  intentMap.set('PlayerRankings', playerRankings.getPlayerRankings);
  intentMap.set('scoreboard', quiz.scoreboard)
  intentMap.set('score-by-email', quiz.getScoreByEmail)
  intentMap.set('self-score', quiz.getSelfScore)
  intentMap.set('TeamHighestAndLowest', teamHighestAndLowest.getTeamHighestLowest)
  intentMap.set('PlayerRecentPerformance', playerPerformance.getPlayerPerformance)
  intentMap.set('PlayerDebut', playerPerformance.getPlayerDebut)
  intentMap.set('PlayerRecords', playerPerformance.getPlayerRecords)
  intentMap.set('HandCricket', handCricket.clearContexts)
  intentMap.set('TossDecision', handCricket.tossDecision);
  intentMap.set('HandCricketGame', handCricket.handCricketGame)
  intentMap.set('BattingOrBowling', handCricket.battingOrBowling)
  intentMap.set('Exit', handCricket.exit)
  
  agent.handleRequest(intentMap)
})

// set port 
app.listen(process.env.PORT || 8080)

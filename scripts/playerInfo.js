var axios = require('axios');
const cheerio = require('cheerio');
const charts = require('./charts')
const cric_api_token = 'w4i3XV88TFWcYQSWLvmJMvKuyag2';
const { Card, Suggestion } = require('dialogflow-fulfillment')
var cron = require('node-cron');
const fetch = require('node-fetch');
// const charts = require('./charts')

module.exports = {

  //Method to display player details.
  fetchPlayerDetails: async function (agent) {

    var playerName = agent.parameters.person.name;
    const data = await getPlayerStats1(playerName);
    if( typeof data['fullName'] == 'undefined') {
      agent.add(data);
    }
    else {
      agent.add(new Card({
        title : data['name'],
        imageUrl : data['imageURL']
      }));
      agent.add(data['fullName'] + ' was born in ' + data['born'] + data['profile']);
      agent.add('His batting style is ' + data['battingStyle'] + " and bowling style is " + data['bowlingStyle']); 
      agent.add('\nThe major teams he has played for are: ' + data['majorTeams']);
      agent.add(new Suggestion('Batting figures'));
      agent.add(new Suggestion('Bowling figures'));
      agent.add("If you wanna know more type 'Get batting figures' or 'Get bowling figures'");
    }
  },

  //Method to display player stats.
  playerStats: async function(agent) {

    var playerName = agent['contexts'][0]['parameters']['person'];
    var style = agent.parameters.Type;
    var result = await figures(playerName.name,style);
    result = result[0]
    agent.add("Player Name: "+playerName.name);
    agent.add(result[0][0]+'   '+result[0][1]+'   '+result[0][2]+'  '+result[0][3]);
    for(var i = 1; i < result.length; i++) {
      var res = result[i];
      agent.add(res[0]+' :         '+res[1]+'         '+res[2]+'         '+res[3]);
    }
  },

  //Method to display live score or upcoming matches.
  liveScore: async function(agent) {
    var URL;
    var team = null;
    var tag;
    var type = agent.parameters.LiveOrUpcoming;
    var result = [];

    if(agent.parameters.TeamName){
      team = agent.parameters.TeamName;
    }
    else{
      team = agent.parameters.CountryName;
    }
    
    if(type.localeCompare('live') == 0) {
      URL = 'https://www.cricbuzz.com/cricket-match/live-scores';
      tag = 'a.cb-lv-scrs-well-live'; 
      result = await getLiveScores(URL, tag, team);
    }
    else if(type.localeCompare('upcoming') == 0) {
      URL = 'https://www.icc-cricket.com/mens-schedule/list';
      result = await getUpcomingMatches(URL, team);
      
    }
    else if(type.localeCompare('series') == 0) {
      var result = await getUpcomingSeries(team);
      var len = 5;
      if(result.length == 0) {
        agent.add('Sorry, no upcoming series.');
        return;
      }
      if(result.length < 5) {
        len = result.length;
      }
      for(var i = 0; i<len ; i++) {
        agent.add(new Card({
          title : result[i][0],
          buttonText : 'To know more.',
          buttonUrl : result[i][1]
        }));
      }
      return;
    }
    if(result.length != 0){
      agent.add('Some of the '+type+' matches are: ');
      var count = 5;
      if(result.length < 5)
          count = result.length;
      for(var i = 0; i < count; i++){
        agent.add(new Card({
          title : (i+1) + '.  ' + result[i][0],
          buttonText : 'For more info.',
          buttonUrl : result[i][1]
        }))
      }
      if(type.localeCompare('upcoming') == 0)
        agent.add('If you want to set a reminder for any of the above matches please enter the adjoining number(1-5) as mentioned in the match list ')  
    }
    else {
      agent.add('Sorry no '+type+' matches available.');
    }
  },

  //Method to get head to head stats between two players.
  playerHeadtoHead: async function(agent) {
    
    var player1 = agent.parameters.playerName[0];
    var player2 = agent.parameters.playerName[1];
    var format = agent.parameters.Format_PlayerHeadToHead;
    if((typeof player1 == 'undefined') || (typeof player2 == 'undefined')) {
      agent.add('Please enter the player names properly.')
    }
    else{
      var result = await getPlayerHeadtoHead(player1.name,player2.name, format);
      if(result.length == 0){
        result = await getPlayerHeadtoHead(player2.name,player1.name, format);
      }
      const URL = result.pop()
      if(result.length == 0) {
        agent.add("Sorry, could not find any stats between "+player1.name+" and "+player2.name+".");
      }
      else {
        agent.add(player1.name+' v '+player2.name+' in '+format);

        for(var i in result) {
          agent.add(result[i]);
        }
      }
      if(URL != ''){
        agent.add(`${player1.name} vs ${player2.name}: ${URL}`);
      }
    }
  },

  //Method to get individual player stats.
  getIndividualPlayerStats: async function(agent) {
    
    var playerName = agent.parameters.person;
    playerName = playerName.name;
    var type = agent.parameters.type;
    var stats = agent.parameters.Stats;
    var format = agent.parameters.Format;
    if(typeof playerName == 'undefined') {
      agent.add('Please enter the player name properly.')
    }
    else {
      var result = await individualPlayerStats(playerName, format, type, stats, true);
      if(Array.isArray(result)) {
        agent.add('There is more than one player found with the name '+playerName);
        for(var i in result) {
          agent.add(new Card({title:result[i].fullName}));
          //agent.add(new Suggestion(result[i].fullName));
        }
        agent.add('Please specify the full name.');
      }
      else {
        agent.add(result);
      }
    }
  },

  //Follow up to getIndividualPlayerStats.
  getIndividualPlayerStatsFollowUp: async function(agent) {

    var playerName = agent.parameters.person;
    playerName = playerName.name;
    var type = agent['contexts'][0]['parameters']['type'];
    var stats = agent['contexts'][0]['parameters']['Stats'];
    var format = agent['contexts'][0]['parameters']['Format'];
    
    if(typeof playerName == 'undefined') {
      agent.add('Please enter the player name properly.')
    }
    else {
      var result = await individualPlayerStats(playerName, format, type, stats, false);
      agent.add(result);
    }
  },

  setReminderForMatches: async function(agent) {
    var type = agent.contexts[0].parameters.LiveOrUpcoming
    var number = parseInt(agent.parameters.number)
    var team = null;
    var result = []

    if( number>5 || number<1) {
      agent.add('Please enter a number between 1-5')
      return
    }

    if(agent.contexts[0].parameters.TeamName){
      team = agent.contexts[0].parameters.TeamName
    }
    else{
      team = agent.contexts[0].parameters.CountryName
    }

    if(type.localeCompare('upcoming') == 0) {
      URL = 'https://www.icc-cricket.com/mens-schedule/list';
      result = await getUpcomingMatches(URL, team);
    }
    else if(type.localeCompare('series') == 0) {
      result = await getUpcomingSeries(team);
    }
    
    var res = result[number-1][0].split(" on ");
    var r = res[1].slice(0, -8);
    var d = new Date(r);
    var cronText = d.getMinutes()+" "+d.getHours()+" "+d.getDate()+" "+d.getMonth()+" *"
    var text = res[0]+' is about to start.'
    scheduler(cronText, text)
    agent.add('Reminder has been set for '+res[0]+' at '+res[1])
  }

};


//Schedule reminder for the given match
const scheduler = (cronText, text) => {
  cron.schedule(cronText, () => {
    console.log('hello')
    webhookURL = 'https://chat.googleapis.com/v1/spaces/AAAAWOEhF_8/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=J5MYIj3EvP_pzm5sMCET3AK-RO9BH3uzNUU-SC0mp_g%3D'
    const data = JSON.stringify({
      'text': text,
    }); 
    fetch(webhookURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: data,
    }).then((response) => {
      console.log('Reminder shown.');
    });
  });
}


//Api call to fetch upcoming matches.
const getUpcomingMatchesFromRemote = async (URL) => {
    const response = await axios.get(URL);
    const {data} = response;
    return data;
}
  
//Method to retrieve upcoming matches.
const getUpcomingMatches = async(URL, team) => {

  var flag = false
    if(team)
        flag = true;
    const html = await getUpcomingMatchesFromRemote(URL);
    var scores = [];
    const $ = cheerio.load(html);
    $('.match-block').each(function(_,element) {
      const time = $(element).children('.match-block__meta-container').text().trim()
      const teamContainer = $(element).children('.match-block__team-container').children()
      var teamsData
      $(teamContainer).each(function(_,teams){
          teamsData = $(teams).children('.match-block__summary').text().trim()
      })
      const link = 'https://www.icc-cricket.com'+$(element).children('.match-block__buttons').children('a').attr('href')
      if(team != null && teamsData.includes(team)){
        flag = true;
        scores.push([teamsData+' on '+time, link]);  
    }
    else if(flag == false)
        scores.push([team+' on '+time, link]);
    })
   
    return scores;
}

//Method to retrieve Live scores.
const getLiveScores = async (URL, tag, team) => {
    var flag = false
    if(team)
        flag = true;
    const html = await getLiveScoresFromRemote(URL);
    var scores = [];
    var team1;
    const $ = cheerio.load(html);
    team = team.replace(/(^\s*)|(\s*$)/gi,"");
    if(team.includes(' ')) {
        var matches = team.match(/\b(\w)/g); 
        team1 = matches.join('');
    }
    else{
        team1 = team.slice(0,3);
    }
    $(tag).each(function (_, element){
        const scoreContainer = $(element).children().children();
        const score = $(scoreContainer).text();
        if(team != null && score.includes(team1.toUpperCase())){
            flag = true;
            scores.push(score);  
        }
        else if(flag == false)
            scores.push(score);
    })
    return scores;
}

//Api call to get Live scores.
const getLiveScoresFromRemote = async (URL) => {
  const response = await axios.get(URL);
  const {data} = response;
  return data;
}

//Api call to get player data given player name.
const getDataFromRemote1 = async (name, flag = false) => {

  let URL = 'https://cricapi.com/api/playerFinder?apikey='+cric_api_token+'&name='+name;
  const response = await axios.get(URL);
  const {data} = response;
  try {
    if(data.data.length == 0){
      throw 'Could not find player with name '+name;
    }
  }
  catch(err) {
    return err;
  }
  if(flag && (data.data.length > 1)){
    return data.data;
  }
  return data.data[0].pid;
}

//Api call to get the player stats given player ID.
const getPlayerStats1 = async(name, flag = false) => {

  var pid = await getDataFromRemote1(name, flag);
  if(typeof pid == 'string') {
    return pid;
  }
  else if(Array.isArray(pid)) {
    return pid;
  }
  var URL = 'https://cricapi.com/api/playerStats?apikey='+cric_api_token+'&pid='+pid;
  const response = await axios.get(URL);
  const {data} = response;
  return data;
}

//Method to create player stats table.
const figures = async(name, style) => {

  var data = await getPlayerStats1(name);

  if(typeof data == 'string'){
    return data;
  }
 
  var result = [];
  if(style.localeCompare('batting') == 0){
      var res = []
      var attr_list = ['Mat','Inns','Runs','HS','50','100','Ave','SR']
      var format_list = ['tests','ODIs','T20Is']
      var k = 0;
 
      result.push(['Attributes','Test','ODI','T20I'])
      attr_list.forEach( function(attr) {
          res = []
          res.push(attr_list[k])
          format_list.forEach(function(format) {
              res.push(data['data'][style][format][attr])
          })
          result.push(res)
          k++;
      })
  }
  else {
      var res = []
      var attr_list = ['Mat','Inns','Wkts','BBM','Econ','5w','4w','Runs','Balls']
      var format_list = ['tests','ODIs','T20Is']
      var k = 0;
 
      result.push(['Attributes','Test','ODI','T20I'])
      attr_list.forEach( function(attr) {
          res = []
          res.push(attr_list[k])
          format_list.forEach(function(format) {
              res.push(data['data'][style][format][attr])
          })
          result.push(res)
          k++;
      })
  }
  return [result]
}

//Method to get data from the url.
async function getPlayerHeadToHeadFromRemote(url) {

  var result = await axios.get(url);
  var {data} = result;
  return data;
}

//Method to fetch the head to head stats between two players.
async function getPlayerHeadtoHead(player1, player2, formatProvided) {

  const URL = "http://www.cricmetric.com/matchup.py?batsman="+player1+"&bowler="+player2+"&groupby=year";
  const html = await getPlayerHeadToHeadFromRemote(URL);
  var imageURL = ''
  const statistics = [];
  const $ = cheerio.load(html);
  var playerStatsObj = {}
  $('div.panel').each(function(_,element){
    var format = $(element).children('.panel-heading').text();
    if(format.localeCompare(formatProvided) == 0){
      const stats = $(element).children().children().children().children('tfoot').text();    
      var temp = stats.split(" ");
      var temp = stats.split(" ");
      playerStatsObj = {
        balls: temp[5],
        runs: temp[3],
        dismisals: temp[7],
        dotBalls: temp[9],
        fours: temp[11],
        sixes: temp[13],
        strikeRate: temp[15]
      };
      statistics.push('Number of balls: '+temp[5]);
      statistics.push('Runs scored: '+temp[3]);
      statistics.push('Number of dismisals: '+temp[7]);
      statistics.push('Number of dot balls: '+temp[9]);
      statistics.push("Number of 4's: "+temp[11]);
      statistics.push("Number of 6's: "+temp[13]);
      statistics.push('Strike rate: '+temp[15]);
    }
  })
  console.log("OBJ: ", playerStatsObj);
  if(Object.keys(playerStatsObj).length)
    imageURL = await charts.createPlayerHeadToHeadChart(playerStatsObj, player1, player2);
  statistics.push(imageURL);
  return statistics;
}

//Method to retrieve individual player stats.
const individualPlayerStats = async(name, format, style, attribute, flag) => {

  const data = await getPlayerStats1(name, flag);

  if(typeof data == 'string'){
    return data;
  }
  else if(Array.isArray(data)){
    return data;
  }

  const mapping = new Map()

  var batting = ['50','100','St','Ct','6s','4s','NO','Inns','Mat'];
  batting.forEach(function(attr){
      mapping[attr] = "'s number of " + attr + "s in";
  })
  mapping['SR'] = "'s strike rate in ";
  mapping['Ave'] = " average in ";
  mapping['HS'] = "'s highest score in";
  mapping['Runs'] = "'s total runs ";

  mapping["10"] = "'s number of 10 wicket hauls in ";
  mapping["5w"] = "'s number of 5 wicket hauls in ";
  mapping["4w"] = "'s number of 4 wicket hauls in ";
  mapping["Econ"] = "'s economy in ";
  mapping["BBM"] = "'s best figures in a match in ";
  mapping["BBI"] = "'s best figures in an innings in ";
  mapping["Wkts"] = "'s number of wickets in ";
  mapping["Balls"] = "'s number of balls bowled in ";

  var result = '';
  if(style){
      result += data['name'] + mapping[attribute] + format + " is " + data['data'][style][format][attribute]
  }
  else{
    if(attribute.localeCompare('Runs') == 0){
      result += data['name'] + mapping[attribute] + ' scored in ' + format + " is " + data['data']['batting'][format][attribute]
      if(data['data']['bowling'][format][attribute] != '-')
        result += '. '+data['name'] + mapping[attribute] + ' conceded in ' + format + " is " + data['data']['bowling'][format][attribute]
    }
    else if(attribute.localeCompare('Ave') == 0){
      result += data['name'] + "'s batting" + mapping[attribute]  + format + " is " + data['data']['batting'][format][attribute]
      if(data['data']['bowling'][format][attribute] != '-')
        result += '. '+data['name'] + "'s bowling" + mapping[attribute]  + format + " is " + data['data']['bowling'][format][attribute]
    }
    else{
      var res = data['data']['batting'][format][attribute]
      if(typeof res === 'undefined'){
          result += data['name'] + mapping[attribute]+ " " + format + " is " + data['data']['bowling'][format][attribute];
      }
      else{
        result += data['name'] + mapping[attribute]+ " " + format + " is " + res;
      }
    }
  }

  if(result.localeCompare('') == 0){
    result += 'Could not find the details at the moment.';
  }
  return result;
}

//Method to fetch upcoming series from the given URL.
const getUpcomingSeries= async function(teamName){

  const URL = 'https://www.cricbuzz.com/cricket-schedule/series';
  const response = await getUpcomingMatchesFromRemote(URL);
  const $ = cheerio.load(response);
  var result = [];
  $('.cb-sch-lst-itm').each(function(_, element) {
    const heading = $(element).children();
    if(teamName && heading.text().includes(teamName+' '))
      result.push([heading.text(),'https://www.cricbuzz.com/'+heading.attr('href')]);
    else if(!teamName) {
      result.push([heading.text(),'https://www.cricbuzz.com/'+heading.attr('href')]);
    }
  });
  return result;
}

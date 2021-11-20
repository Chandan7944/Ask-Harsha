const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {

  //Fetches player performance in past 5 matches.
  getPlayerPerformance: async function(agent) {

    var playerName = agent.parameters.playerName
    var url 
    
    if(playerName.name.toLowerCase().localeCompare('rashid khan') == 0) {
      url = 'https://www.espncricinfo.com/player/rashid-khan-793463'
    }
    else {
      url = 'https://www.espncricinfo.com/'+ await getPlayerId(playerName.name)
    }
    
    const html = await getDataFromRemote(url);
    const $ = cheerio.load(html);
    var result = []
    var patt = /[0-3][0-9]-[A-Z][a-z][a-z]-[0-2][0-9][0-9][0-9]/;
    
    $('tr.player_matches-recent-font').each(function(_,element){
        var match = $(element).children().first().children('a').children('span').text()
        var score = $(element).children('td:nth-child(2)').text()  
        var date =   $(element).children('td:nth-child(3)').text() 
        
        if(score.localeCompare('--') == 0) {
          score = 'DNB'
        } 
        if(!date.match(patt)){
            const temp = $(element).children('td:nth-child(4)').text()  
            result.push([match, score, date, temp])
        }  
        else
            result.push([match, score, 'DNB',date])
    })
    if(result.length == 0) {
      agent.add('No recent performances available.')
      return
    }
    for(var i in result) {
      agent.add(result[i][0])
      agent.add(' - Batting: '+result[i][1]+'  Bowling: '+result[i][2]+' on '+result[i][3])  
    }
  },

  //Gets player debut information
  getPlayerDebut: async function(agent) {
    
    var playerName = agent.parameters.playerName
    var formatSpecified = agent.parameters.format
    var url 
    
    if(playerName.name.toLowerCase().localeCompare('rashid khan') == 0) {
      url = 'https://www.espncricinfo.com/player/rashid-khan-793463'
    }
    else {
      url = 'https://www.espncricinfo.com/'+ await getPlayerId(playerName.name)
    }
    const html = await getDataFromRemote(url);
    const $ = cheerio.load(html);
    var result = []
    var flag = true
    
    if(!formatSpecified) {
      flag = false
      result.push('Here is the list of '+playerName.name+' debut matches: ')
    }
    
    $('div.more-content.black-1000').children().each(function(_,element){
      const temp = $(element).children('.player-matches-padding').children('h5').text()
      const format = temp.substr(0,temp.indexOf(' ')) //Test, ODI, T20I
      
      var debutMatch 
      if(flag && format.localeCompare(formatSpecified) == 0){
        debutMatch = $(element).children('div:nth-child(2)').text().slice(5)
        result.push(playerName.name+' made his '+format + ' debut in the match ' + debutMatch)
        flag = true
      }
      else if(!flag) {
        debutMatch = $(element).children('div:nth-child(2)').text().slice(5)
        result.push(format + '- ' + debutMatch)
      }
    })

    if(flag && result.length == 0) {
      agent.add('Could not find any data for the player by name '+playerName.name)
      return
    }
    if(!flag && result.length == 1) {
      agent.add('Could not find any data for the player by name '+playerName.name)
      return
    }
    
    for(var i in result) {
      agent.add(result[i])
    }
  },

  //Gets most recent records of the player
  getPlayerRecords: async function(agent) {
    
    var playerName = agent.parameters.playerName
    var url 
    
    if(playerName.name.toLowerCase().localeCompare('rashid khan') == 0) {
      url = 'https://www.espncricinfo.com/player/rashid-khan-793463'
    }
    else {
      url = 'https://www.espncricinfo.com/'+ await getPlayerId(playerName.name)
    }
    
    const html = await getDataFromRemote(url);
    const $ = cheerio.load(html);
    var result = []
 
    $('.player-overview-records-grid').children().each(function(_,element){
      var ele = $(element).children().children().children('.flex-row')
      var rank = $(ele).children('.record-enhanced_hash').text()
      var rec = $(ele).children('div:nth-child(2)').children('p:nth-child(1)').text()
      var format = $(ele).children('div:nth-child(2)').children('p:nth-child(2)').text()
      result.push(rank + ' ' + rec + ' (' + format + ')')
    })

    if(result.length == 0) {
      agent.add('Could not find any player by name '+playerName.name)
      return
    }

    agent.add('Here are the top 3 records of '+playerName.name+':')
    for(var i in result) {
      agent.add(result[i])
    }
  }
}

const getDataFromRemote = async (URL) => {
  const response = await axios.get(URL);
  const {data} = response;
  return data;
}

const getPlayerId = async(player) => {

  const url = "http://search.espncricinfo.com/ci/content/player/search.html?search="+player+"&x=0&y=0"
  const html = await getDataFromRemote(url);
  const $ = cheerio.load(html);
  var link = $('.pnl650M').children('div:nth-child(2)').children('.ColumnistSmry').children('a').attr('href')
  if(!link) {
    link = $('.pnl650M').children('div:nth-child(1)').children('.ColumnistSmry').children('a').attr('href')
  }
  return link;
}


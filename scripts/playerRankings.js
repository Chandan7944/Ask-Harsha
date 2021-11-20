var axios = require('axios');
const cheerio = require('cheerio');
const { Card, Payload } = require('dialogflow-fulfillment');

module.exports = {

  //Method to display player rankings in the specified format.
  getPlayerRankings: async function(agent) {

    var format = agent.parameters.Format;
    var type = agent.parameters.type;
    if((type.localeCompare('batting') == 0) || (type.localeCompare('bowling') == 0)){
      type = type.charAt(0).toUpperCase() + type.slice(1);
    }
    var tag = format+' '+type+' Rankings';
    var res = await playerRankings(tag, format)
    list = res[1].replace(/\s\s+/g, '  ').split("  ")
    var str;
    agent.add(tag+':')
    agent.add('1. '+res[0])
    for(var i = 1; i<(list.length-1) ; i++) {
        agent.add((i+1)+'. '+list[i])
    }
    let json = {
        "hangouts": {
          "sections": [
            {
              "widgets": [          
                {
                "buttons": [
                  {
                    "textButton": {
                      "text": "Full Rankings",
                      "onClick": {
                        "openLink": {
                          "url": res[3]
                        }
                      }
                    }
                  }
                ]
              }]
            }
          ]
        }
      };
    let payload = new Payload(
        'hangouts',
        json,
        { rawPayload: true, sendAsMessage: true}
    );
    agent.add(payload);
  }
}



//Method to retrieve player rankings provided format and type(batsman/bowler/all-rounder).
const playerRankings = async(type, format) => {

  const URL = "https://www.icc-cricket.com/rankings/mens/player-rankings/"+format;
  const html = await getDataFromRemote(URL);
  const $ = cheerio.load(html);
  var ranking = []

  $('div.rankings-block__container').each(function(_,element){
      const heading = $(element).children('.rankings-block__banner').children().children('h4').text()
      if(heading.localeCompare(type) == 0){
          const first = $(element).children('.rankings-block__banner').children('.rankings-block__banner-link')
                      .children().children('.rankings-block__banner--player-info').children('.rankings-block__banner--name').text()
          const list = $(element).children('table').children('tbody').children().children('.name').text()
          ranking.push(first)
          ranking.push(list)
          const link = $(element).children('.btn-wrapper').children().attr('href')
          ranking.push('For complete details: ')
          ranking.push('https://www.icc-cricket.com/'+link)
          return ranking;
      }
  })
  return ranking;
}

//Method to fetch data from URL.
const getDataFromRemote = async (URL) => {
  
  const response = await axios.get(URL);
  const {data} = response;
  return data;
}

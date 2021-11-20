const ranking_limit = 10, team_limit = 11, matches_limit = 5;
var axios = require('axios');
const token = 'DMU6O5dEPEa25CSHO2d9514UODP4Ax4SZJILnfmu18pxPszjoKfTBw4EVUXg';
const url = 'https://cricket.sportmonks.com/api/v2.0';

module.exports = {

    // get list of global rankings
    find_ICC_rankings: async function (agent) {
        await query_global_rankings(agent).then(arr => {arr[1].forEach(str => {agent.add(str)})}).catch(err => {agent.add("Error Occurred: " + err)});
    },

    global_ranking_of_team: function(agent) {
        agent.add("Please Enter one of the following ICC Cricket Category, ODI, TEST, or T20I");
    },

    global_rank_of_team_in: async function (agent) {
        const team = agent['contexts'][0]['parameters']['countries'].toLowerCase()
        if(team != ''){
            await query_global_rankings(agent, team).then(arr => {
                if(arr[0] != '')
                    agent.add(arr[0])
                else
                    agent.add(`No Ranking found for ${team} in this category`)
            })
            .catch(err => {
                agent.add(`No Team named ${team}`)
                console.log("Error : ", err);
            })
        }else{
            agent.add("Please Enter a valid team for the category.")
            }
    }
};

// get global rankings in ODI/Test/T20
async function query_global_rankings(agent, country = ''){
    const category = agent['parameters']['icc_categories'];
    const link = `${url}/team-rankings?api_token=${token}&filter[type]=${category}&filter[gender]=men`

    let response = await axios.get(link).catch(error => {console.log("Error : ",error)})
    let jsonResponse = response.data.data[0]['team']
    let rank = ``
    let teams = []
    jsonResponse.forEach(team => {
      if(teams.length < ranking_limit)
        teams.push(`${team.position}. ${team.name}`)
      if(team.name.toLowerCase() == country){
        rank = `${country.toUpperCase()} is #${team.position}`
      }
    })
    if(teams.length < jsonResponse.length){
      teams.push(`And ${jsonResponse.length - teams.length} more...`)
    }
    return [rank, teams]
  }


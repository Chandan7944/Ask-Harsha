const ranking_limit = 10, team_limit = 11, matches_limit = 5;
var axios = require('axios');
const token = 'DMU6O5dEPEa25CSHO2d9514UODP4Ax4SZJILnfmu18pxPszjoKfTBw4EVUXg';
const url = 'https://cricket.sportmonks.com/api/v2.0';

module.exports = {
    team_details: async function(agent) {
        const team = agent['parameters']['countries'].toLowerCase()
        let find_team = async function(){
          const link = `${url}/teams?api_token=${token}&filter[name]=${team}&include=squad`

          let response = await axios.get(link).catch(error => {console.log("Error : ",error)})
          let jsonResponse = await response.data.data[0]['squad']
  
          let cnt = 1
          let uniquePlayers = new Set()
          agent.add(`Team ${team.toUpperCase()} Squad :`)
          for (const player of jsonResponse) {
            if(!uniquePlayers.has(player.id)){
              uniquePlayers.add(player.id)
              if(cnt <= team_limit){
                agent.add(`${cnt++}. ${player.fullname}`)
              }
            }
          }
          if(uniquePlayers.size > cnt){
            agent.add(`And ${uniquePlayers.size - cnt} more...`)
          }

          return "SUCCESS";
        }
        if(team != ''){
          await find_team().then(res => {console.log(res)}).catch(err => {
            console.log("ERROR: ", err)
            agent.add(`Could not find team ${team}`)
          })
        }else{
          agent.add("Please enter a valid team")
        }
    
    }
};

const matches_limit = 5;
var axios = require('axios');
const token = 'DMU6O5dEPEa25CSHO2d9514UODP4Ax4SZJILnfmu18pxPszjoKfTBw4EVUXg';
const url = 'https://cricket.sportmonks.com/api/v2.0';

module.exports = {

    matches_played: async function(agent) {
        const team = agent['parameters']['countries'].toLowerCase()
        let find_matches = async function(){ 
          const show_matches = 5
          let team_map = await create_team_map().catch(err => {
            console.log("ERROR: ", err)
            throw "ERROR OCCURRED while creating team map"
          })
          const link = `${url}/teams?api_token=${token}&filter[name]=${team}&include=results`
          let response = await axios.get(link).catch(error => {console.log("Error : ",error)})
          let jsonResponse = await response.data.data[0]['results']
          let cnt = 0
          for (const matches of jsonResponse) {
            ++cnt
            agent.add(`${team_map.get(matches['localteam_id'])} VS ${team_map.get(matches['visitorteam_id'])} ${matches['round']}, ${matches['note']}`)
            if(cnt >= show_matches){
              agent.add(`And ${jsonResponse.length - show_matches} more...`)
              break
            }
          }
          return "SUCCESS"
        }
        if(team != ''){
          await find_matches().then(res => {console.log(res)}).catch(err => {
            console.log("ERROR: ", err)
            agent.add(`Could not find team ${team}`)
          })
        }else{
          agent.add("Please enter a valid team")
        } 
    },

    // matches played between dates a and b
    matches_between_dates: async function(agent) {
        const start_date = agent['parameters']['date-period']['startDate'].slice(0, 10)
        const end_date = agent['parameters']['date-period']['endDate'].slice(0, 10)
        let find_matches = async function(){
          let team_map = await create_team_map().catch(err => {
            console.log("ERROR: ", err)
            throw "ERROR OCCURRED while creating team map"
          })
          const link = `${url}/fixtures?api_token=${token}&filter[starts_between]=${start_date},${end_date}`
          let response = await axios.get(link).catch(error => {console.log("Error : ",error)})
          let jsonResponse = await response.data.data
          let cnt = 0
          agent.add(`Showing matches between ${start_date} and ${end_date}`)
          for (const matches of jsonResponse){
            agent.add(`${team_map.get(matches['localteam_id'])} VS ${team_map.get(matches['visitorteam_id'])} ${matches['round']}, ${matches['note']}`)
            if(++cnt >= matches_limit){
              agent.add("And " + jsonResponse.length + " more matches ....")
              break
            }
          }
          return "SUCCESS"
      }
        await find_matches().catch(err =>{
          console.log(err)
          agent.add(`Could not find matches between ${start_date} and ${end_date}`)
          })
    }


};


// team id to name mapping
async function create_team_map(){
    const team_link = `${url}/teams/?api_token=${token}`
    let team_map = new Map()
    let response = await axios.get(team_link).catch(error => {console.log("Error : ",error)})
    let jsonResponse = await response.data.data
    jsonResponse.forEach(team => {
      team_map.set(team.id, team.name)
    })
    return team_map
  }
var axios = require('axios');
const token = 'DMU6O5dEPEa25CSHO2d9514UODP4Ax4SZJILnfmu18pxPszjoKfTBw4EVUXg';
const url = 'https://cricket.sportmonks.com/api/v2.0';

module.exports = {
    venue_details: async function(agent) {
        const city = agent['parameters']['geo-city'].toLowerCase()

        let find_venues = async function(){
          const link = `${url}/venues?api_token=${token}&filter[city]=${city}`

          let response = await axios.get(link).catch(error => {console.log("Error : ",error)})
          let jsonResponse = await response.data.data

          agent.add(`Showing venues in city ${city.toUpperCase()}`)
          if(jsonResponse.length == 0) throw "No stadium found"
          for (const stadium of jsonResponse){
            agent.add(`${stadium.name} in ${stadium.city} with capacity ${stadium.capacity == 0? "Not found": stadium.capacity}.`)
          }
          return "SUCCESS"
        }
        if(city != ''){
          await find_venues().catch(err =>{
            console.log(err)
            agent.add(`Could not find any stadium in ${city}`)
          })
        }else{
          agent.add("Please Enter a valid City")
        }
    }
};
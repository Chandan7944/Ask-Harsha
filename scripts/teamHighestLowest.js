const { Client } = require('pg');

//Method to establish connection to db.
function connectToDB() {
  const client = new Client({
    user: 'askharsha',
    host: '34.93.210.170',
    database: 'askharsha',
    password: 'postgress',
    port: 5432,
  })
  client.connect();
  return client;
}

async function queryDB(query) {
  try{
    const client = connectToDB();
    var result = await client.query(query);
    await client.end();
  }
  catch(err){
    console.log(err.stack);
  }
  return result.rows;
}


module.exports = {

  //Gets highest or lowest runs scored by a team given format
  getTeamHighestLowest: async function(agent) {

    var teamName = agent.parameters.countryName
    var format = agent.parameters.format
    var type = agent.parameters.stats            //Highest or Lowest
    type = type.localeCompare('HS') == 0? 'highest' : type
    var query
    var temp = ''
    
    if(teamName && format && type) {
      query = "Select \""+type+"_"+format+"\", \""+ type+"_"+format+"_against\"" +" from scores where team = '"+teamName+"'";
      
      var result = await queryDB(query)
      Array.from(result).map(row => temp = row[type+"_"+format]+' against '+row[type+"_"+format+"_against"])
      
      if(result.length == 0) {
        agent.add('Sorry, could not find any stats.')
        return
      }
      agent.add(teamName+' '+type+' score in '+format+' is '+temp)
    }
    else if(type && format) {
      if(type.localeCompare('lowest') == 0){
        
        query = "Select \"team\", \""+type+"_"+format+"\", \""+ type+"_"+format+"_against\" "+" from scores where \""+type+"_"+format+"\" = (select min(\""+type+"_"+format+"\") from scores)";
        var result = await queryDB(query)
        Array.from(result).map(row => temp = row[type+"_"+format]+' by '+row.team+' against '+row[type+"_"+format+"_against"])
      }
      else {
        
        query = "Select \"team\", \""+type+"_"+format+"\", \""+ type+"_"+format+"_against\" "+" from scores";
        var result = await queryDB(query)
        var max = 0
        Array.from(result).map(row => (parseInt(row[type+"_"+format].substring(0,3)) > max) ? (temp = row[type+"_"+format]+' by '+row.team+' against '+row[type+"_"+format+"_against"], max = parseInt(row[type+"_"+format].substring(0,3)) ) : '')
      }
      if(result.length == 0) {
        agent.add('Sorry, could not find any stats.')
        return
      }
      agent.add(type.charAt(0).toUpperCase()+type.slice(1)+" score recorded in "+format+' is '+temp)
    }
  }
}


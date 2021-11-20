const { Client } = require('pg');
const charts = require('./charts')
const { Card } = require('dialogflow-fulfillment')

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

module.exports = {

    getHeadToHeadStats: async function(agent) {

      var team1Name = agent.parameters.countryName[0];
      var team2Name = agent.parameters.countryName[1];
      var cityName = agent.parameters.city;
      var year = agent.parameters.year;
      var result;
  
      if(agent.parameters.countryName.length < 2 && agent.parameters.iplTeamName.length < 2) {
        agent.add('Please specify the team names properly.');
      }
      else if((typeof team1Name == 'undefined') || (typeof team2Name == 'undefined')) {
        team1Name = agent.parameters.iplTeamName[0];
        team2Name = agent.parameters.iplTeamName[1];
        if(cityName){
          result = await iplHead2Head(team1Name, team2Name, 'city', cityName);
        }
        else {
          result = await iplHead2Head(team1Name, team2Name, null, null);
        }
      }
      else {
        if(cityName){
          result = await getOdiStats(team1Name,team2Name,cityName);
        }
        else {
          result = await getOdiStats(team1Name,team2Name);
        }
      }
      const URL = result[1]
      result = result[0]
      for(var i in result) {
        agent.add(result[i]);
      }

      agent.add(`${team1Name} VS ${team2Name} : ${URL}`)
    },
      //Fulfillment to individual team stats given city/year.
  getTeamStats: async function(agent) {

    var team = agent.parameters.teamName;
    var city = agent.parameters.city;
    var year = agent.parameters.year;
    var result;

    if((!agent.parameters.teamName) && (!agent.parameters.iplTeamName)) {
      console.log("TEAM NAME: ", team);
      result = await getTeamStatsGivenYearorVenue(team, city, year);
    }
    else if(team) {
      result = await getTeamStatsGivenYearorVenue(team, city, year);
    }
    else {
      team = agent.parameters.iplTeamName;
      result = await matchesInYear(year, team, city);
    }
    const URL = result.pop();
    for(var i in result) {
      agent.add(result[i]);
    }
    if(URL != ''){
      console.log("URL is: ", URL);
      agent.add(`${team} stats: ${URL}`)
    }
  }

};

//Method to query the database.
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

//Method to fetch head to head stats between two teams.
async function getOdiStats(team1, team2, city = null)  {

  var res = [];
  var url
  var query = '';

  var highestRunMarginTeam1 = 0;
  var highestRunVenueTeam1 = '';
  var highestWktMarginTeam1 = 0;
  var highestWktVenueTeam1 = '';
  var highestRunMarginTeam2 = 0;
  var highestRunVenueTeam2 = '';
  var highestWktMarginTeam2 = 0;
  var highestWktVenueTeam2 = '';

  try {
    //Query if city is provided.
    if(city) {
      query = "select * from menodidata where (team1 = '"+team1+"' and team2 = '"+team2+"' and ground = '"+city+"') or (team1='"+team2+"' and team2 = '"+team1+"' and ground = '"+city+"');";
    }//Query if city is not provided
    else {
      query = "select * from menodidata where team1 = '"+team1+"' and team2 = '"+team2+"' or team1='"+team2+"' and team2 = '"+team1+"';"
    }

    //Query to database.
    var result = await queryDB(query);
    var team1Home = 0,team1Away = 0,team2Home = 0,team2Away = 0;
    //If there is no stats available.
    if(result.length == 0) {
      res.length = 0;
      if(city) {
        res.push('Sorry could not find any stats for teams '+team1+' and '+team2+' in '+city);
        return res;
      }
      else {
        res.push('Sorry could not find any stats for teams '+team1+' and '+team2);
        return res;
      }
    }
    else {
      for(var i in result){

        var temp = (result[i].margin).split(" ");
        //Condition to count home wins of team1 and away wins of team2. 
        if(result[i].team1 == team1) {
          if(result[i].winner == team1) {
            team1Home += 1;
            //To check the highest margin win.
            if((result[i].margin).includes('wickets')) {
              if(parseInt(temp[0]) > highestWktMarginTeam1) {
                highestWktMarginTeam1 = parseInt(temp[0]);
                highestWktVenueTeam1 = 'On '+result[i].match_date+' at '+result[i].ground;
              }
            }
            else {
              if(parseInt(temp[0]) > highestRunMarginTeam1) {
                highestRunMarginTeam1 = parseInt(temp[0]);
                highestRunVenueTeam1 = 'On '+result[i].match_date+' at '+result[i].ground;
              }
            }
          }
          else {
              team2Away += 1;
              //To check the highest margin win.
              if((result[i].margin).includes('wickets')) {
                if(parseInt(temp[0]) > highestWktMarginTeam2) {
                  highestWktMarginTeam2 = parseInt(temp[0]);
                  highestWktVenueTeam2 = 'On '+result[i].match_date+' at '+result[i].ground;
                }
              }
              else {
                if(parseInt(temp[0]) > highestRunMarginTeam2) {
                  highestRunMarginTeam2 = parseInt(temp[0]);
                  highestRunVenueTeam2 = 'On '+result[i].match_date+' at '+result[i].ground;
                }
            }
          }
        }//Condition to count away wins of team1 and home wins of team2. 
        else {
          if(result[i].winner == team1) {
            team1Away += 1;
            //To check the highest margin win.
            if((result[i].margin).includes('wickets')) {
              if(parseInt(temp[0]) > highestWktMarginTeam1) {
                highestWktMarginTeam1 = parseInt(temp[0]);
                highestWktVenueTeam1 = 'On '+result[i].match_date+' at '+result[i].ground;
              }
            }
            else {
              if(parseInt(temp[0]) > highestRunMarginTeam1) {
                highestRunMarginTeam1 = parseInt(temp[0]);
                highestRunVenueTeam1 = 'On '+result[i].match_date+' at '+result[i].ground;
              }
            }
          }
          else {
            team2Home += 1;
            //To check the highest margin win.
            if((result[i].margin).includes('wickets')) {
              if(parseInt(temp[0]) > highestWktMarginTeam2) {
                highestWktMarginTeam2 = parseInt(temp[0]);
                highestWktVenueTeam2 = 'On '+result[i].match_date+' at '+result[i].ground;
              }
            }
            else {
              if(parseInt(temp[0]) > highestRunMarginTeam2) {
                highestRunMarginTeam2 = parseInt(temp[0]);
                highestRunVenueTeam2 = 'On '+result[i].match_date+' at '+result[i].ground;
              }
            }
          }
        }
      }

      res.push('Total number of games played: '+(team2Away+team2Home+team1Home+team1Away))
      const team1Wins = team1Home+team1Away, team2Wins = team2Away+team2Home
      await charts.createHeadToHeadChart(team1, team2, team1Wins, team2Wins)
      .then(URL => {
        url = URL
      }).catch(err => console.log("Error Occured: ", err))
      if(city) {
        res.push(team1+" :"+(team1Home+team1Away));
        res.push(team2+" :"+(team2Home+team2Away));
      }
      else {
        res.push(team1+": ")
        res.push(" - Total Wins: "+(team1Home+team1Away))
        res.push(" - Home Wins: "+team1Home+"   - Away Wins: "+team1Away)
        res.push(team2+": ")
        res.push(" - Total Wins: "+(team2Home+team2Away))
        res.push(" - Home Wins: "+team2Home+"   - Away Wins: "+team2Away)
      }
    } 
    res.push('𝐒𝐨𝐦𝐞 𝐨𝐭𝐡𝐞𝐫 𝐢𝐧𝐭𝐞𝐫𝐞𝐬𝐭𝐢𝐧𝐠 𝐬𝐭𝐚𝐭𝐬 𝐚𝐫𝐞:');
    res.push('Highest margin win by '+team1+' against '+team2+': ');
    if(highestRunMarginTeam1 != 0) {
      res.push('-Runs: '+'By '+highestRunMarginTeam1+' runs '+highestRunVenueTeam1);
    }
    if(highestWktMarginTeam1 != 0) {
      res.push('-Wickets: '+'By '+highestWktMarginTeam1+' wickets '+highestWktVenueTeam1);
    }
    res.push('Highest margin win by '+team2+' against '+team1+': ');
    if(highestRunMarginTeam2 != 0) {
      res.push('-Runs: '+'By '+highestRunMarginTeam2+' runs '+highestRunVenueTeam2);
    }
    if(highestWktMarginTeam2 != 0) {
      res.push('-Wickets: '+'By '+highestWktMarginTeam2+' wickets '+highestWktVenueTeam2);
    }
  }
  catch (err) {
    console.log(err.stack);
  }
  return [res, url];
}

//Method to get individual stats given teamName/city/year.
async function getTeamStatsGivenYearorVenue(teamName, city, year) {

  var res = [];
  var query = '';
  //Query if teamname, city and year is specified.
  if(teamName && city && year){
    res.push('Total games played by '+teamName+' at '+city+' in the year '+year+':');
    query = "select * from menodidata where (team1 = '"+teamName+"' and match_date ~* '"+year+"' and ground = '"+city+"') or (team2='"+teamName+"' and match_date ~* '"+year+"' and ground = '"+city+"');";
  }
  //Query if teamname and city is specified.
  else if(teamName && city) {
    res.push('Total games played by '+teamName+' at '+city+':');
    query = "select * from menodidata where (team1 = '"+teamName+"' and ground = '"+city+"') or (team2='"+teamName+"' and ground = '"+city+"');";
  }
  //Query if teamname and year is specified.
  else if(teamName && year) {
    res.push('Total games played by '+teamName+' in the year '+year+':');
    query = "select * from menodidata where (team1 = '"+teamName+"' and match_date ~* '"+year+"') or (team2='"+teamName+"' and match_date ~* '"+year+"');";
  }
  //Query if year and city is specified.
  else if(city && year) {
    res.push('Games played in '+city+' in the year '+year+':');
    query = "select * from menodidata where (ground = '"+city+"' and match_date ~* '"+year+"');";
  }
  //Query if teamname is specified.
  else if(teamName) {
    res.push('Total games played by '+teamName+': ');
    query = "select * from menodidata where team1 = '"+teamName+"' or team2 = '"+teamName+"';";
  }
  //Query if city is specified.
  else if(city) {
    res.push('Games played in '+city+':');
    query = "select * from menodidata where ground = '"+city+"';";
  }
  //Query if year is specified.
  else if(year) {
    res.push('Some of the Games played in the year '+year+': ');
    query = "select * from menodidata where match_date ~* '"+year+"';";
  }

  var wins = 0,loss = 0;
  try {
    var url =''
    var result = await queryDB(query);
    if(teamName) {
      for(var i in result) {
        if(result[i].team1 == teamName || result[i].team2 == teamName) {
          if(result[i].winner == teamName) {
            wins += 1;
          }
          else {
            loss += 1;
          }
        }
      }
    }
    else {
      for(var i=0;i<result.length && i<=5;i++) {
        res.push(result[i].team1+' v '+result[i].team2+" at "+result[i].ground+' on '+result[i].match_date+', '+result[i].winner+' won by '+result[i].margin);
      }
      if(result.length > 5) {
        res.push((result.length-5)+' more rows... ');
      }
    }
    if( wins == 0 && loss == 0 && teamName) {
      res.length = 0;
      res.push('No matches were played.');
    }
    else if( !teamName && result.length == 0) {
      res.length = 0;
      res.push('No matches were played.');
    }
    else if(teamName) {
      res.push('Number of games won: '+wins);
      res.push('Number of games lost: '+loss);
      res.push('Win percentage: '+Math.round((wins/(wins+loss))*100)+'%');
      url = await charts.createTeamStatsChart(teamName, wins, loss);
    }
    res.push(url)
  }
  catch (err) {
    console.log(err.stack);
  }
  return res;
}

//Method to fetch head to head between two ipl teams.
async function iplHead2Head(team1, team2, factor, value, condition = true) {
  
  var team1_count = 0;
  var team1_home_wins = 0;
  var team2_count = 0;
  var team2_home_wins = 0;
  var no_result = 0

  var highest_run_margin1 = 0;
  var highest_wicket_margin1 = 0;
  var highest_run_margin2 = 0;
  var highest_wicket_margin2 = 0;

  var result;
  var res = [];
  var url;


  if(!value && !factor){
    const query = "Select * from iplmatches where (team1 = '"+team1+"'  AND team2 = '"+team2+"') OR \
                (team1 = '"+team2+"' AND team2 = '"+team1+"')";
    result = await queryDB(query);


    if(result.length == 0){
      res.push('No matches played between '+team1+' and '+team2);
      return res;
    }

    res.push('Total number of games played: ' + result.length)
    for(var i in result)
    {
      if(result[i].winner.localeCompare(team1) == 0)
      {
        team1_count += 1
        if(result[i].team1 == team1){
          team1_home_wins += 1
        }
      }
      else if (result[i].winner.localeCompare(team2) == 0){
        team2_count += 1
        if(result[i].team1 == team2){
          team2_home_wins += 1
        }
      }
      else 
        no_result += 1
    }

    res.push(team1+": ")
    res.push(" - Total Wins: "+team1_count)
    res.push(" - Home Wins: "+team1_home_wins+"   - Away Wins: "+(team1_count-team1_home_wins))
    res.push(team2+": ")
    res.push(" - Total Wins: "+team2_count)
    res.push(" - Home Wins: "+team2_home_wins+"   - Away Wins: "+(team2_count-team2_home_wins))
  }
  else {
    const query = "Select * from iplmatches where ((team1 = '"+team1+"'  AND team2 = '"+team2+"') OR \
                (team1 = '"+team2+"' AND team2 = '"+team1+"')) AND "+ factor +" ='"+value+"'";
    result = await queryDB(query)

    if(result.length == 0){
      res.push('No matches played between '+team1+' and '+team2+' in ' + value);
      return res;
    }

    for( var i in result){
      if(result[i].winner.localeCompare(team1) == 0)
        team1_count += 1
      else if(result[i].winner.localeCompare(team2) == 0)
        team2_count += 1
      else 
        no_result += 1
    }

    res.push('Total number of games played: '+result.length)
    res.push('  - ' + team1 + ': ' + team1_count)
    res.push('  - ' + team2 + ': ' + team2_count)
  }

  if(condition == true){
    for(var i in result){
      if(result[i].winner.localeCompare(team1) == 0){
        if(result[i].result.localeCompare('runs') == 0){
          if(parseInt(result[i].result_margin) > highest_run_margin1) {
            highest_run_margin1 = ' by ' + parseInt(result[i].result_margin) + ' runs on ' + result[i].date + ' at ' + result[i].venue + ', ' + result[i].city;;
          }
        }
        else if(result[i].result.localeCompare('wickets') == 0){
          if(parseInt(result[i].result_margin) > highest_wicket_margin1) {
            highest_wicket_margin1 = ' by ' + parseInt(result[i].result_margin) + ' wickets on ' + result[i].date + ' at ' + result[i].venue + ', ' + result[i].city;;
          }
        }
      }
      else if (result[i].winner.localeCompare(team2) == 0){
        if(result[i].result.localeCompare('runs') == 0){
          if(parseInt(result[i].result_margin) > highest_run_margin2)
            highest_run_margin2 = ' by ' + parseInt(result[i].result_margin) + ' runs on ' + result[i].date + ' at ' + result[i].venue + ', ' + result[i].city;
        }
        else if(result[i].result.localeCompare('wickets') == 0){
          if(parseInt(result[i].result_margin) > highest_wicket_margin2)
            highest_wicket_margin2 = ' by ' + parseInt(result[i].result_margin) + ' wickets on ' + result[i].date + ' at ' + result[i].venue + ', ' + result[i].city;
        }
      }
    }
    res.push("𝐒𝐨𝐦𝐞 𝐨𝐭𝐡𝐞𝐫 𝐢𝐧𝐭𝐞𝐫𝐞𝐬𝐭𝐢𝐧𝐠 𝐬𝐭𝐚𝐭𝐬 𝐚𝐫𝐞: ")
    res.push(team1 + ' highest win margin')
    res.push(' - Runs: ' + highest_run_margin1);
    res.push(' - Wickets: ' + highest_wicket_margin1);
    res.push(team2 + ' highest win margin')
    res.push(' - Runs: ' + highest_run_margin2);
    res.push(' - Wickets: ' + highest_wicket_margin2);
  }
  await charts.createHeadToHeadChart(team1, team2, team1_count, team2_count)
  .then(URL => {
    url = URL
  }).catch(err => console.log("Error Occured: ", err))
  return [res, url];
}

//Method to fetch match details for a team given year/city.
const matchesInYear = async(year, team, city, venue=null) => {

  var result;
  var res = [];
  
  // If year is specified 
  if(year){
    // If team is not specified
    if(!team){
      // If city is not specified
      if(!city){
        const query = "Select * from iplmatches where date ~* '"+ year +"'"  
        result = await queryDB(query);
        res.push('Some of the IPL matches in the year '+year+' are')
      }
      // If city is specified
      else{
        const query = "Select * from iplmatches where date ~* '"+ year +"' AND city ='"+city+"'";  
        result = await queryDB(query);
        res.push('Some of the IPL matches played in the year '+year+' at the '+city);
      }

      // Print result
      if(result.length > 5){
        for(var i = 0; i < 5; i++){
          res.push(result[i].team1 +' vs '+ result[i].team2 + ' at ' + result[i].venue + ' on ' + result[i].date);
        }
        res.push('And ' + ( result.length - 5) + ' more matches');
      }
      else {
        for(var i in result){
          res.push(result[i].team1 +' vs '+ result[i].team2 + ' at ' + result[i].venue + ' on ' + result[i].date)
        }
      }
      return res;
    }

    // If team ,city and year is specified
    else if(team && city){
      const query = "Select * from iplmatches where date ~* '"+ year +"' AND city ='"+city+"' AND (team1 ='"+team+"' OR team2 ='"+team+"')";
      result = await queryDB(query);
      res.push('Stats of the matches played by '+team+' in the year '+year+' at the '+city);
    }    
    // If venue is specified
    else if(venue){
      const query = "Select * from iplmatches where (team1 = '"+team+"' OR  \
              team2 = '" +team+ "') AND venue ='"+venue+"' AND date ~* '"+ year +"'";
      result = await queryDB(query);
      res.push('Stats of the matches played by '+team+' in the year '+year+ ' are ');
    }
    // If team and year is specified
    else {
      const query = "Select * from iplmatches where date ~* '"+ year +"' AND (team1 ='"+team+"' OR team2 ='"+team+"')";  
      result = await queryDB(query);
      res.push('Stats of the matches played by '+team+' in the year '+year+ ' are ');
    }
  }
  // If year is not specified
  else{
    // If venue is specified
    if(venue){
      const query = "Select * from iplmatches where (team1 = '"+team+"' OR  \
                team2 = '" +team+ "') AND venue ='"+venue+"'";
      result = await queryDB(query);
      res.push('Stats of the matches played by '+team+' at the venue '+venue+ ' are ');
    }
    else if(city && team) {
      const query = "Select * from iplmatches where (team1 = '"+team+"' OR team2 = '" +team+ "') and city = '"+city+"'";
      result = await queryDB(query);
      res.push("Overall stats for "+ team +" at "+city+": ");
    }// If city is specified
    else if(city){
      const query = "Select * from iplmatches where city ='"+city+"'";
      result = await queryDB(query);
      res.push("Number of matches played: "+result.length);
      res.push("Some of the matches are: ")
      for(var i = 0; i < 5; i++)
        res.push(result[i].team1 +' vs '+ result[i].team2 + ' at ' + result[i].venue + ' on ' + result[i].date)
      return res;
    }
    else {
      const query = "Select * from iplmatches where (team1 = '"+team+"' OR team2 = '" +team+ "')";
      result = await queryDB(query);
      res.push("Overall stats for "+ team +": ")
    }
  }

  var no_of_wins = 0;

  if(result.length == 0) {
    res.length = 0;
    res.push('No matches were played.');
    return res;
  }

  for(var i in result){
      if(result[i].winner.localeCompare(team) == 0)
        no_of_wins ++;
  }

  res.push('Number of matches played: ' + result.length);
  res.push('Wins: ' + no_of_wins);
  res.push('Loss: ' + (result.length - no_of_wins))
  res.push('Win percentage: '+Math.round((no_of_wins/result.length)*100)+'%')
  const url = await charts.createTeamStatsChart(team, no_of_wins, result.length - no_of_wins);
  res.push(url)
  return res;
}

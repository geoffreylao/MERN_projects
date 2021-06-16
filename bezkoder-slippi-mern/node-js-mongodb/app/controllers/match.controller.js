// Controller Variables
const db = require("../models");
const Match = db.matches;

// .slp parsing function imports
const { SlippiGame } = require('@slippi/slippi-js');
const fs = require('fs');
const uri = db.url;
var MongoClient = require('mongodb').MongoClient;

// POST upload function imports
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const rimraf = require('rimraf');
const DIR = path.resolve(__dirname, '../public/');

// Variables for parse_folder function
var obj_arr = [];
var failed_inserts = [];
var count = 0;

function splitFilename(str){
  return str.split('/')[2];
}

function parse_slp(filename){
  try {
    var game = new SlippiGame(filename);
    // Get game settings – stage, characters, etc
    var settings = game.getSettings();
    // Get metadata - start time, platform played on, etc
    var metadata = game.getMetadata();
    // Get computed stats - openings / kill, conversions, etc
    var stats = game.getStats();
    // Get frames – animation state, inputs, etc
    const frames = game.getFrames();

    var p0_conversions = [];
    var p1_conversions = [];
  
    for (let index = 0; index < stats.conversions.length; index++) {
      if(stats.conversions[index].playerIndex == 0){
        p0_conversions.push(stats.conversions[index]);
      }else if(stats.conversions[index].playerIndex == 1){
        p1_conversions.push(stats.conversions[index]);
      }
    }
  
    var p0_stocks = [];
    var p1_stocks = [];
    p0Kills = 0;
    p1Kills = 0;
  
    for (let index = 0; index < stats.stocks.length; index++) {
      if(stats.stocks[index].playerIndex == 0){
        p0_stocks.push(stats.stocks[index]);
        if(stats.stocks[index].deathAnimation !== null){
          p1Kills++;
        }
      }else if(stats.stocks[index].playerIndex == 1){
        p1_stocks.push(stats.stocks[index]);
        if(stats.stocks[index].deathAnimation !== null){
          p0Kills++;
        }
      }
    }
  
    var stage_dict = {
      2 : "FOUNTAIN_OF_DREAMS",
      3 : "POKEMON_STADIUM",
      4 : "PEACHS_CASTLE",
      5 : "KONGO_JUNGLE",
      6 : "BRINSTAR",
      7 : "CORNERIA",
      8 : "YOSHIS_STORY",
      9 : "ONETT",
      10 : "MUTE_CITY",
      11 : "RAINBOW_CRUISE",
      12 : "JUNGLE_JAPES",
      13 : "GREAT_BAY",
      14 : "HYRULE_TEMPLE",
      15 : "BRINSTAR_DEPTHS",
      16 : "YOSHIS_ISLAND",
      17 : "GREEN_GREENS",
      18 : "FOURSIDE",
      19 : "MUSHROOM_KINGDOM",
      20 : "MUSHROOM_KINGDOM_2",
      22 : "VENOM",
      23 : "POKE_FLOATS",
      24 : "BIG_BLUE",
      25 : "ICICLE_MOUNTAIN",
      26 : "ICETOP",
      27 : "FLAT_ZONE",
      28 : "DREAMLAND",
      29 : "YOSHIS_ISLAND_N64",
      30 : "KONGO_JUNGLE_N64",
      31 : "BATTLEFIELD",
      32 : "FINAL_DESTINATION"
    }
  
    var char_dict = {
      0 : "CAPTAIN_FALCON",
      1 : "DONKEY_KONG",
      2 : "FOX" ,
      3 : "GAME_AND_WATCH",
      4 : "KIRBY",
      5 : "BOWSER",
      6 : "LINK",
      7 : "LUIGI",
      8 : "MARIO",
      9 : "MARTH",
      10 : "MEWTWO",
      11 : "NESS",
      12 : "PEACH",
      13 : "PIKACHU",
      14 : "ICE_CLIMBERS",
      15 : "JIGGLYPUFF",
      16 : "SAMUS",
      17 : "YOSHI",
      18 : "ZELDA",
      19 : "SHEIK",
      20 : "FALCO",
      21 : "YOUNG_LINK",
      22 : "DR_MARIO",
      23 : "ROY",
      24 : "PICHU",
      25 : "GANONDORF"
    }

    function check_winner(stats){

        var player_zero_percent;
        var player_one_percent;
        var winner;

        // set last stocks final percent
        for (let i = 0; i < stats.stocks.length; i++) {
            if(stats.stocks[i].playerIndex == 0){
                player_zero_percent = stats.stocks[i].currentPercent;
            }else if(stats.stocks[i].playerIndex == 1){
                player_one_percent = stats.stocks[i].currentPercent;
            }
        }

        if(p0Kills == 4){
            winner = 0;
        }else if(p1Kills == 4){
            winner =  1;
        }else if(metadata.lastFrame == 28800){
            if(p0Kills > p1Kills){
                winner =  0;
            }else if(p0Kills < p1Kills){
                winner =  1;
            }else if(p0Kills === p1Kills){
                if(player_zero_percent > player_one_percent){
                    winner = 1;
                }else if(player_zero_percent < player_one_percent){
                    winner = 0;
                }else if(player_zero_percent == player_one_percent){
                    winner = 2;
                }
            }
        }else{
            winner = 3;
        }

        switch(winner){
            case 0:
                return metadata.players[0].names.code;
            case 1:
                return metadata.players[1].names.code;
            case 2:
                return "DRAW";
            case 3:
                return "INCOMPLETE"

        }
    }


    var myobj = {
      matchid: metadata.startAt + metadata.players[0].names.code + metadata.players[1].names.code,
      settings: {
        isTeams: settings.isTeams,
        isPal: settings.isPAL,
        stageId: settings.stageId,
        stageString: stage_dict[settings.stageId],
      },
      metadata: {
        startAt: new Date(metadata.startAt),
        lastFrame: metadata.lastFrame,
        minutes: stats.overall[0].inputsPerMinute.total,
        gameComplete: check_winner(stats) === "INCOMPLETE" ? false : true,
        winner: check_winner(stats),
        firstBlood: metadata.players[stats.stocks[0].playerIndex].names.code
      }, 
      players: [
        {
          playerIndex: settings.players[0].playerIndex,
          characterId: settings.players[0].characterId,
          characterColor: settings.players[0].characterColor,
          code: metadata.players[0].names.code,
          name: metadata.players[0].names.netplay,
          characterString: char_dict[settings.players[0].characterId],
          actionCounts: {
            wavedashCount: stats.actionCounts[0].wavedashCount,
            wavelandCount: stats.actionCounts[0].wavelandCount,
            airDodgeCount: stats.actionCounts[0].airDodgeCount,
            dashDanceCount: stats.actionCounts[0].dashDanceCount,
            spotDodgeCount: stats.actionCounts[0].spotDodgeCount,
            ledgegrabCount: stats.actionCounts[0].ledgegrabCount,
            rollCount: stats.actionCounts[0].rollCount
          },
          conversions: p1_conversions,
          inputCounts: {
            buttons: stats.overall[0].inputCounts.buttons, // digital inputs
            triggers: stats.overall[0].inputCounts.triggers,
            cstick: stats.overall[0].inputCounts.cstick,
            joystick: stats.overall[0].inputCounts.joystick,
            total: stats.overall[0].inputCounts.total // total inputs
          },
          conversionCount: stats.overall[0].conversionCount,
          totalDamage: stats.overall[0].totalDamage,
          killCount: p0Kills,
          creditedKillCount: stats.overall[0].killCount,
          successfulConversions: stats.overall[0].successfulConversions.count,
          openings: stats.overall[0].openingsPerKill.count,
          neutralWins: stats.overall[0].neutralWinRatio.count,
          counterHits: stats.overall[0].counterHitRatio.count,
          trades: stats.overall[0].beneficialTradeRatio.count,
          deathCount: p1Kills,
          lcancelPercent: parseInt((stats.actionCounts[0].lCancelCount.success / (stats.actionCounts[0].lCancelCount.success + stats.actionCounts[0].lCancelCount.fail)) * 100),
          grabCount: stats.actionCounts[0].grabCount,
          throwCount: stats.actionCounts[0].throwCount,
          groundTechCount: stats.actionCounts[0].groundTechCount,
          wallTechCount: stats.actionCounts[0].wallTechCount,
          stocks: p0_stocks
        },
        {
          playerIndex: settings.players[1].playerIndex,
          characterId: settings.players[1].characterId,
          characterColor: settings.players[1].characterColor,
          code: metadata.players[1].names.code,
          name:  metadata.players[1].names.netplay,
          characterString: char_dict[settings.players[1].characterId],
          actionCounts: {
            wavedashCount: stats.actionCounts[1].wavedashCount,
            wavelandCount: stats.actionCounts[1].wavelandCount,
            airDodgeCount: stats.actionCounts[1].airDodgeCount,
            dashDanceCount: stats.actionCounts[1].dashDanceCount,
            spotDodgeCount: stats.actionCounts[1].spotDodgeCount,
            ledgegrabCount: stats.actionCounts[1].ledgegrabCount,
            rollCount: stats.actionCounts[1].rollCount
          },
          conversions: p0_conversions,
          inputCounts: {
            buttons: stats.overall[1].inputCounts.buttons, // digital inputs
            triggers: stats.overall[1].inputCounts.triggers,
            cstick: stats.overall[1].inputCounts.cstick,
            joystick: stats.overall[1].inputCounts.joystick,
            total: stats.overall[1].inputCounts.total // total inputs
          },
          conversionCount: stats.overall[1].conversionCount,
          totalDamage: stats.overall[1].totalDamage,
          killCount: p1Kills,
          creditedKillCount: stats.overall[1].killCount,
          successfulConversions: stats.overall[1].successfulConversions.count,
          openings: stats.overall[1].openingsPerKill.count,
          neutralWins: stats.overall[1].neutralWinRatio.count,
          counterHits: stats.overall[1].counterHitRatio.count,
          trades: stats.overall[1].beneficialTradeRatio.count,
          deathCount: p0Kills,
          lcancelPercent: parseInt((stats.actionCounts[1].lCancelCount.success / (stats.actionCounts[1].lCancelCount.success + stats.actionCounts[1].lCancelCount.fail)) * 100),
          grabCount: stats.actionCounts[1].grabCount,
          throwCount: stats.actionCounts[1].throwCount,
          groundTechCount: stats.actionCounts[1].groundTechCount,
          wallTechCount: stats.actionCounts[1].wallTechCount,
          stocks: p1_stocks
        }
      ],
    };
  
    obj_arr.push(myobj);
  } catch (error) {
    console.log(error)
    console.log("Error parsing: " + (filename));
    failed_inserts.push((filename));
  }
}

function parse_folder(folder, res){
  fs.readdirSync(folder).forEach(file => {
    console.log("Parsing: " + file);

    parse_slp(folder + '/' + file, obj_arr);
    count++;
  });

  var myfailed_arr = [];

  console.log(failed_inserts);
  myfailed_arr = [...failed_inserts];

  console.log("Failed inserts: " + myfailed_arr.length);
  myfailed = (count -  myfailed_arr.length);

  res.json({inserted: obj_arr.length , failed_arr: myfailed_arr})

  if (obj_arr.length === 0) {
    console.log("Nothing to insert!")

    failed_inserts = [];
  }else{
    MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true } , function(err,db) {
      if (err) throw err;
      var dbo = db.db("mongoslp");

      dbo.collection('matches').insertMany(obj_arr, {ordered: false} , function(err, res) {
        if (err){
          console.log("error")

          obj_arr = [];
          failed_inserts = [];
          count = 0;
        }else{
          console.log("Number of documents inserted: " + res.insertedCount);
          myinsert = res.insertedCount;
  
          db.close();
  
          obj_arr = [];
          failed_inserts = [];
          count = 0;

        }
      }); // dbo.collection
    }); // MongoClient.connect
  } // else

}// parse_folder

const slippiFilter = function(req, file, cb) {
  // Accept images only
  if (!file.originalname.match(/\.(slp|SLP|zip)$/)) {
      req.fileValidationError = 'Only slippi files are allowed!';
      return cb(new Error('Only slippi files are allowed!'), false);
  }
  cb(null, true);
};

function showTwoDigits(number) {
  return ("00" + number).slice(-2);
}

function displayTime(currentFrame) {
  var fps = 60;
  var h = Math.floor(currentFrame/(60*60*fps));
  var m = (Math.floor(currentFrame/(60*fps))) % 60;
  var s = (Math.floor(currentFrame/fps)) % 60;
  var f = currentFrame % fps;
  return (h) + ":" + showTwoDigits(m) + ":" + showTwoDigits(s) + ":" + showTwoDigits(f);
}

function getStats(connect_code, res){
  var myTotalMatches = 0,myTotalTime,myTotalLRAStart = 0,myTotalTimeouts = 0,
  myTotalWins = 0,myTotalLosses = 0,myWinrate,
  myCharUsage,myOppCharUsage,myVsCharWins,myVsCharLoss,myAsCharWins,
  myAsCharLoss,myStageWins,myStageLoss,
  myNeutralWins = 0,myOppNeutralWins = 0,myCounterHits = 0,myOppCounterHits = 0,
  myBeneficialTrades = 0,myOppBeneficialTrades = 0, myOpenings = 0, myOppOpenings = 0,
  myKills = 0, myOppKills = 0,
  myOpeningsPerKO,myOppOpeningsPerKO, myConversions = 0, myOppConversions = 0,
  mySuccessfulConversions = 0, myOppSuccessfulConversions = 0, myConversionRate,myOppConversionRate,
  myDamage = 0, myOppDamage = 0, myAvgDamagePerOpening,myOppAvgDamagePerOpening,
  myAvgKOpercent,myOppAvgKOpercent,myTotalLcancel = 0, myOppTotalLcancel = 0,
  myLcancels,myOppLcancels,myFourStocks = 0,
  myOppFourStocks = 0,myAvgStocksTaken,
  myOppAvgStocksTaken, myTotalStockDifferential = 0,
  myOppTotalStockDifferential = 0, myAvgStockDifferential,myOppAvgStockDifferential,
  myFirstBloods = 0,myOppFirstBloods = 0,
  myBestPunish = 0,myOppBestPunish = 0,myLowestKill = 1000,myOppLowestKill = 1000,
  myHighestKill = 0,myOppHighestKill = 0, myTotalInputs = 0, myOppTotalInputs = 0, myTotalMinutes = 0, myIPM,myOppIPM,
  myTotalDigitalInputs = 0, myOppTotalDigitalInputs = 0, 
  myDigitalIPM,myOppDigitalIPM,myActionCountArr,myOppActionCountArr,
  myMoveUsageArr,myOppMoveUsageArr


  // Character Usage
  myCharUsage = new Array(26).fill(0);
  myOppCharUsage = new Array(26).fill(0);

  // Character Wins
  myVsCharWins = new Array(26).fill(0);
  myAsCharWins = new Array(26).fill(0);

  // Character Loss
  myVsCharLoss = new Array(26).fill(0);
  myAsCharLoss = new Array(26).fill(0);

  // Stage W/L
  myStageWins = new Array(33).fill(0);
  myStageLoss = new Array(33).fill(0);

  // Action counts
  myActionCountArr = Array.from({length: 26}, e => Array(7).fill(0));
  myOppActionCountArr = Array.from({length: 26}, e => Array(7).fill(0));

  myMoveUsageArr = {
    neutralWinMoves : Array.from({length: 26}, e => Array(63).fill(0)),
    counterHitMoves : Array.from({length: 26}, e => Array(63).fill(0)),
    tradeMoves : Array.from({length: 26}, e => Array(63).fill(0)),
    killMoves : Array.from({length: 26}, e => Array(63).fill(0))
  }

  myOppMoveUsageArr = {
    neutralWinMoves : Array.from({length: 26}, e => Array(63).fill(0)),
    counterHitMoves : Array.from({length: 26}, e => Array(63).fill(0)),
    tradeMoves : Array.from({length: 26}, e => Array(63).fill(0)),
    killMoves : Array.from({length: 26}, e => Array(63).fill(0))
  }

  var oppTally = {}

  var shortestGametime = 28800;
  var longestGametime = 0;

  var quitoutmyCharUsage = new Array(26).fill(0);
  var quitoutmyOppCharUsage = new Array(26).fill(0);

    // death direction
  var deathDirectionCharUsage = Array.from({length: 4}, e => Array(26).fill(0));

  var deathDirectionOppCharUsage =  Array.from({length: 4}, e => Array(26).fill(0));

  // grab success and whiffs
  var grabCountSuccessCharUsage = new Array(26).fill(0);
  var grabCountWhiffCharUsage = new Array(26).fill(0);

  var grabCountSuccessOppCharUsage = new Array(26).fill(0);
  var grabCountWhiffOppCharUsage = new Array(26).fill(0);

  // up forward back down
  var throwCountCharUsage =  Array.from({length: 4}, e => Array(26).fill(0))
  var throwCountOppCharUsage =  Array.from({length: 4}, e => Array(26).fill(0))

  // backward forward neutral fail
  var groundTechCountCharUsage =  Array.from({length: 4}, e => Array(26).fill(0))
  var groundTechCountOppCharUsage =  Array.from({length: 4}, e => Array(26).fill(0))

  // grab success and whiffs
  var wallTechCountSuccessCharUsage = new Array(26).fill(0);
  var wallTechCountFailCharUsage = new Array(26).fill(0);

  var wallTechCountSuccessOppCharUsage = new Array(26).fill(0);
  var wallTechCountFailOppCharUsage = new Array(26).fill(0);
  
  var myCreditedKills = 0;
  var myOppCreditedKills = 0;

  var sdCharUsage = new Array(26).fill(0);
  var sdOppCharUsage = new Array(26).fill(0);

  var deathUsage = new Array(26).fill(0);
  var deathOppUsage = new Array(26).fill(0);

  var zeroToDeaths = 0;
  var oppZeroToDeaths = 0;
  
  var frames = 0;

  for (let i = 0; i < res.length; i++) {
    if(!res[i].settings.isTeams){
      myTotalMatches++;

      frames += res[i].metadata.lastFrame;
  
      myTotalMinutes += res[i].metadata.minutes;
  
      if(res[i].metadata.firstBlood === connect_code){
        myFirstBloods++;
      }else{
        myOppFirstBloods++;
      }
  
      // Total L R A Start
      if(res[i].metadata.winner === "INCOMPLETE"){
        myTotalLRAStart++;
        for (let j = 0; j < res[i].players.length; j++) {
          if(res[i].players[j].code === connect_code){
            quitoutmyCharUsage[res[i].players[j].characterId]++;
          }else{
            quitoutmyOppCharUsage[res[i].players[j].characterId]++;
          }
        }
      }else{
        if(res[i].metadata.lastFrame > longestGametime){
          longestGametime = res[i].metadata.lastFrame
        }
  
        if(res[i].metadata.lastFrame < shortestGametime){
          shortestGametime = res[i].metadata.lastFrame
        }
      }
  
      // Total Timeouts
      if(res[i].metadata.lastFrame === 28800){
        myTotalTimeouts++;
        console.log(myTotalTimeouts);
      }
  
      // Total Wins/Loss, Stage W/L
      if(res[i].metadata.winner === connect_code){
        myTotalWins++;
        myStageWins[res[i].settings.stageId]++;
        // Vs and As Character Wins
        for (let j = 0; j < res[i].players.length; j++) {
          if(res[i].players[j].code === connect_code){
            myAsCharWins[res[i].players[j].characterId]++;
            
            myTotalStockDifferential += res[i].players[j].killCount - res[i].players[j].deathCount;
            // 4 Stocks
            if(res[i].players[j].killCount === 4 && res[i].players[j].deathCount === 0){
              myFourStocks++;
            }
            }else{
              myVsCharWins[res[i].players[j].characterId]++;
            }      
          }
      }else if(res[i].metadata.winner !== connect_code && res[i].metadata.winner !== 'INCOMPLETE' && res[i].metadata.winner !== 'DRAW'){
        myTotalLosses++;
        myStageLoss[res[i].settings.stageId]++;
  
        // Vs and As Character Loss
        for (let j = 0; j < res[i].players.length; j++) {
          if(res[i].players[j].code === connect_code){
            myAsCharLoss[res[i].players[j].characterId]++;
          }else{
            myVsCharLoss[res[i].players[j].characterId]++;
            
            myOppTotalStockDifferential += res[i].players[j].killCount - res[i].players[j].deathCount;
            // 4 Stocks
            if(res[i].players[j].killCount === 4 && res[i].players[j].deathCount === 0){
              myOppFourStocks++;
            }
          }      
        }
      }
  
      // Character Usage, Neutral Wins, Counter Hits, Openings
      for (let j = 0; j < res[i].players.length; j++) {
        if(res[i].players[j].code === connect_code){
          myCharUsage[res[i].players[j].characterId]++;
          myNeutralWins += res[i].players[j].neutralWins;
          myCounterHits += res[i].players[j].counterHits;
          myBeneficialTrades += res[i].players[j].trades;
          myOpenings += res[i].players[j].openings;
          myKills += res[i].players[j].killCount;
          myCreditedKills += res[i].players[j].creditedKillCount;
          myConversions += res[i].players[j].conversionCount;
          mySuccessfulConversions += res[i].players[j].successfulConversions;
          myDamage += res[i].players[j].totalDamage;
          myTotalInputs += res[i].players[j].inputCounts.total;
          myTotalDigitalInputs += res[i].players[j].inputCounts.buttons;

          
          for (let k = 0; k < res[i].players[j].stocks.length; k++) {
            switch (res[i].players[j].stocks[k].deathAnimation) {
              case 0:
                deathDirectionCharUsage[0][res[i].players[j].characterId]++;
                break;
              case 1:
                deathDirectionCharUsage[1][res[i].players[j].characterId]++;
                break;
              case 2:
                deathDirectionCharUsage[2][res[i].players[j].characterId]++;
                break;
              case null:
                break;
              default:
                deathDirectionCharUsage[3][res[i].players[j].characterId]++;
                break;
            }            
          }
  
          grabCountSuccessCharUsage[res[i].players[j].characterId] += (res[i].players[j].throwCount.up + res[i].players[j].throwCount.forward
            + res[i].players[j].throwCount.back + res[i].players[j].throwCount.down);
          grabCountWhiffCharUsage[res[i].players[j].characterId] += res[i].players[j].grabCount.fail;

          throwCountCharUsage[0][res[i].players[j].characterId] += res[i].players[j].throwCount.up;
          throwCountCharUsage[1][res[i].players[j].characterId] += res[i].players[j].throwCount.forward;
          throwCountCharUsage[2][res[i].players[j].characterId] += res[i].players[j].throwCount.back;
          throwCountCharUsage[3][res[i].players[j].characterId] += res[i].players[j].throwCount.down;

          groundTechCountCharUsage[0][res[i].players[j].characterId] += res[i].players[j].groundTechCount.backward;
          groundTechCountCharUsage[1][res[i].players[j].characterId] += res[i].players[j].groundTechCount.forward;
          groundTechCountCharUsage[2][res[i].players[j].characterId] += res[i].players[j].groundTechCount.neutral;
          groundTechCountCharUsage[3][res[i].players[j].characterId] += res[i].players[j].groundTechCount.fail;

          wallTechCountSuccessCharUsage[res[i].players[j].characterId] += res[i].players[j].wallTechCount.success;
          wallTechCountFailCharUsage[res[i].players[j].characterId] += res[i].players[j].wallTechCount.fail;

          if(j === 0){
            sdCharUsage[res[i].players[j].characterId] += res[i].players[j].deathCount - res[i].players[1].creditedKillCount;
            deathUsage[res[i].players[j].characterId] += res[i].players[1].creditedKillCount;
          }else if(j === 1){
            sdCharUsage[res[i].players[j].characterId] += res[i].players[j].deathCount - res[i].players[0].creditedKillCount;
            deathUsage[res[i].players[j].characterId] += res[i].players[0].creditedKillCount;
          }

          

          if(!isNaN(res[i].players[j].lcancelPercent)){
            myTotalLcancel += res[i].players[j].lcancelPercent;
          }else{
            res[i].players[j].lcancelPercent = 100;
            myTotalLcancel += res[i].players[j].lcancelPercent;
          } 
  
          for (let k = 0; k < res[i].players[j].conversions.length; k++) {
            var currentConversion = res[i].players[j].conversions[k].endPercent - res[i].players[j].conversions[k].startPercent;
  
            if(currentConversion > myBestPunish){
              myBestPunish = currentConversion;
            }
            
            if(res[i].players[j].conversions[k].didKill){
              if(res[i].players[j].conversions[k].moves[0]){
                myMoveUsageArr.killMoves[res[i].players[j].characterId][res[i].players[j].conversions[k].moves[res[i].players[j].conversions[k].moves.length - 1].moveId]++;                
              }
              
              if(res[i].players[j].conversions[k].startPercent === 0){
                zeroToDeaths++;
              }

              if(res[i].players[j].conversions[k].endPercent > myHighestKill){
                myHighestKill = res[i].players[j].conversions[k].endPercent;
              } 
              
              if(res[i].players[j].conversions[k].endPercent < myLowestKill){
                myLowestKill = res[i].players[j].conversions[k].endPercent;
              }
            }
  
            switch(res[i].players[j].conversions[k].openingType){
              case 'neutral-win': 
              if(res[i].players[j].conversions[k].moves[0])
                {myMoveUsageArr.neutralWinMoves[res[i].players[j].characterId][res[i].players[j].conversions[k].moves[0].moveId]++;}
                break;
              case 'counter-attack':
                if(res[i].players[j].conversions[k].moves[0])
                {myMoveUsageArr.counterHitMoves[res[i].players[j].characterId][res[i].players[j].conversions[k].moves[0].moveId]++;}
                break;
              case 'trade':
                if(res[i].players[j].conversions[k].moves[0])
                {myMoveUsageArr.tradeMoves[res[i].players[j].characterId][res[i].players[j].conversions[k].moves[0].moveId]++;}
                break;
              default:
                break;
            }
          }
  
          // Action Counts
          myActionCountArr[res[i].players[j].characterId][0] +=  res[i].players[j].actionCounts.wavedashCount;
          myActionCountArr[res[i].players[j].characterId][1] +=  res[i].players[j].actionCounts.wavelandCount;
          myActionCountArr[res[i].players[j].characterId][2] +=  res[i].players[j].actionCounts.airDodgeCount;
          myActionCountArr[res[i].players[j].characterId][3] +=  res[i].players[j].actionCounts.dashDanceCount;
          myActionCountArr[res[i].players[j].characterId][4] +=  res[i].players[j].actionCounts.spotDodgeCount;
          myActionCountArr[res[i].players[j].characterId][5] +=  res[i].players[j].actionCounts.ledgegrabCount;
          myActionCountArr[res[i].players[j].characterId][6] +=  res[i].players[j].actionCounts.rollCount;
  
        }else{
          let current = res[i].players[j].code;

          if(oppTally[current]){
            oppTally[current]++
          }else{
            oppTally[current] = 1;
          }

          myOppCharUsage[res[i].players[j].characterId]++;
          myOppNeutralWins += res[i].players[j].neutralWins;
          myOppCounterHits += res[i].players[j].counterHits;
          myOppBeneficialTrades += res[i].players[j].trades;
          myOppOpenings += res[i].players[j].openings;
          myOppKills += res[i].players[j].killCount;
          myOppCreditedKills += res[i].players[j].creditedKillCount;
          myOppConversions += res[i].players[j].conversionCount;
          myOppSuccessfulConversions += res[i].players[j].successfulConversions;
          myOppDamage += res[i].players[j].totalDamage;
          myOppTotalInputs += res[i].players[j].inputCounts.total;
          myOppTotalDigitalInputs += res[i].players[j].inputCounts.buttons;
  
          for (let k = 0; k < res[i].players[j].stocks.length; k++) {
            switch (res[i].players[j].stocks[k].deathAnimation) {
              case 0:
                deathDirectionOppCharUsage[0][res[i].players[j].characterId]++;
                break;
              case 1:
                deathDirectionOppCharUsage[1][res[i].players[j].characterId]++;
                break;
              case 2:
                deathDirectionOppCharUsage[2][res[i].players[j].characterId]++;
                break;
              case null:
                break;
              default:
                deathDirectionOppCharUsage[3][res[i].players[j].characterId]++;
                break;
            }
            
          }
  
          grabCountSuccessOppCharUsage[res[i].players[j].characterId] += (res[i].players[j].throwCount.up + res[i].players[j].throwCount.forward
                                                                           + res[i].players[j].throwCount.back + res[i].players[j].throwCount.down);
          grabCountWhiffOppCharUsage[res[i].players[j].characterId] += res[i].players[j].grabCount.fail;

          throwCountOppCharUsage[0][res[i].players[j].characterId] += res[i].players[j].throwCount.up;
          throwCountOppCharUsage[1][res[i].players[j].characterId] += res[i].players[j].throwCount.forward;
          throwCountOppCharUsage[2][res[i].players[j].characterId] += res[i].players[j].throwCount.back;
          throwCountOppCharUsage[3][res[i].players[j].characterId] += res[i].players[j].throwCount.down;

          groundTechCountOppCharUsage[0][res[i].players[j].characterId] += res[i].players[j].groundTechCount.backward;
          groundTechCountOppCharUsage[1][res[i].players[j].characterId] += res[i].players[j].groundTechCount.forward;
          groundTechCountOppCharUsage[2][res[i].players[j].characterId] += res[i].players[j].groundTechCount.neutral;
          groundTechCountOppCharUsage[3][res[i].players[j].characterId] += res[i].players[j].groundTechCount.fail;

          wallTechCountSuccessOppCharUsage[res[i].players[j].characterId] += res[i].players[j].wallTechCount.success;
          wallTechCountFailOppCharUsage[res[i].players[j].characterId] += res[i].players[j].wallTechCount.fail;

          if(j === 0){
            sdOppCharUsage[res[i].players[j].characterId] += res[i].players[j].deathCount - res[i].players[1].creditedKillCount;
            deathOppUsage[res[i].players[j].characterId] += res[i].players[1].creditedKillCount;
          }else if(j === 1){
            sdOppCharUsage[res[i].players[j].characterId] += res[i].players[j].deathCount - res[i].players[0].creditedKillCount;
            deathOppUsage[res[i].players[j].characterId] += res[i].players[0].creditedKillCount;
          }

         

          if(!isNaN(res[i].players[j].lcancelPercent)){
            myOppTotalLcancel += res[i].players[j].lcancelPercent;
          }else{
            res[i].players[j].lcancelPercent = 100;
            myOppTotalLcancel += res[i].players[j].lcancelPercent;
          }
  
          for (let k = 0; k < res[i].players[j].conversions.length; k++) {
            var oppCurrentConversion = res[i].players[j].conversions[k].endPercent - res[i].players[j].conversions[k].startPercent;
  
            if(oppCurrentConversion > myOppBestPunish){
              myOppBestPunish = oppCurrentConversion;
            }          
  
            if(res[i].players[j].conversions[k].didKill){
              if(res[i].players[j].conversions[k].moves[0]){
                myOppMoveUsageArr.killMoves[res[i].players[j].characterId][res[i].players[j].conversions[k].moves[res[i].players[j].conversions[k].moves.length - 1].moveId]++;
              }

              if(res[i].players[j].conversions[k].startPercent === 0){
                oppZeroToDeaths++;
              }

              if(res[i].players[j].conversions[k].endPercent > myOppHighestKill){
                myOppHighestKill = res[i].players[j].conversions[k].endPercent;
              }
              
              if(res[i].players[j].conversions[k].endPercent < myOppLowestKill){
                myOppLowestKill = res[i].players[j].conversions[k].endPercent;
              }
            }
  
            switch(res[i].players[j].conversions[k].openingType){
              case 'neutral-win': 
              if(res[i].players[j].conversions[k].moves[0])
               { myOppMoveUsageArr.neutralWinMoves[res[i].players[j].characterId][res[i].players[j].conversions[k].moves[0].moveId]++;}
                break;
              case 'counter-attack':
                if(res[i].players[j].conversions[k].moves[0])
                {myOppMoveUsageArr.counterHitMoves[res[i].players[j].characterId][res[i].players[j].conversions[k].moves[0].moveId]++;}
                break;
              case 'trade':
                if(res[i].players[j].conversions[k].moves[0])
                {myOppMoveUsageArr.tradeMoves[res[i].players[j].characterId][res[i].players[j].conversions[k].moves[0].moveId]++;}
                break;
              default:
                break;
            }
    
          }
  
          // Action Counts
          myOppActionCountArr[res[i].players[j].characterId][0] +=  res[i].players[j].actionCounts.wavedashCount;
          myOppActionCountArr[res[i].players[j].characterId][1] +=  res[i].players[j].actionCounts.wavelandCount;
          myOppActionCountArr[res[i].players[j].characterId][2] +=  res[i].players[j].actionCounts.airDodgeCount;
          myOppActionCountArr[res[i].players[j].characterId][3] +=  res[i].players[j].actionCounts.dashDanceCount;
          myOppActionCountArr[res[i].players[j].characterId][4] +=  res[i].players[j].actionCounts.spotDodgeCount;
          myOppActionCountArr[res[i].players[j].characterId][5] +=  res[i].players[j].actionCounts.ledgegrabCount;
          myOppActionCountArr[res[i].players[j].characterId][6] +=  res[i].players[j].actionCounts.rollCount;
        }
      }
    }
    else{
 
    }
  }
  // Total Time
  myTotalTime = displayTime(frames);

  // Win Rate
  myWinrate = parseInt((myTotalWins/(myTotalWins+myTotalLosses)) * 100);

  // Openings per KO
  myOpeningsPerKO = myOpenings/myKills;
  myOppOpeningsPerKO = myOppOpenings/myOppKills;

  // Conversion Rate
  myConversionRate = parseInt((mySuccessfulConversions/myConversions) * 100);
  myOppConversionRate = parseInt((myOppSuccessfulConversions/myOppConversions) * 100);

  // Damage Per Opening
  myAvgDamagePerOpening = parseInt(myDamage/myOpenings);
  myOppAvgDamagePerOpening = parseInt(myOppDamage/myOppOpenings);

  // Avg KO Percent
  myAvgKOpercent = parseInt(myDamage/myKills);
  myOppAvgKOpercent = parseInt(myOppDamage/myOppKills);

  // Avg L Cancel percentage
  myLcancels = parseInt(myTotalLcancel/myTotalMatches);
  myOppLcancels = parseInt(myOppTotalLcancel/myTotalMatches);

  // Finished Matches
  var finishedMatches = myTotalMatches - myTotalLRAStart;

  // Avg Stocks Taken
  myAvgStocksTaken = myKills/finishedMatches;
  myOppAvgStocksTaken = myOppKills/finishedMatches;

  // Avg Stock Differential
  myAvgStockDifferential = myTotalStockDifferential / myTotalWins ? myTotalStockDifferential / myTotalWins : 0;
  myOppAvgStockDifferential = myOppTotalStockDifferential / myTotalLosses ? myOppTotalStockDifferential / myTotalLosses : 0;

  // IPM
  myIPM = myTotalInputs / myTotalMinutes;
  myOppIPM = myOppTotalInputs / myTotalMinutes;

  myDigitalIPM = myTotalDigitalInputs / myTotalMinutes;
  myOppDigitalIPM = myOppTotalDigitalInputs / myTotalMinutes;

  // Rival 
  var items = Object.keys(oppTally).map(function(key) {
    return [key, oppTally[key]];
  });

  items.sort(function(first, second) {
    return second[1] - first[1];
  });

  var rivalCharUsage = new Array(26).fill(0);

  for (let i = 0; i < res.length; i++) {
    for (let j = 0; j < res[i].players.length; j++) {
      if(res[i].players[j].code === items[0][0]){
        rivalCharUsage[res[i].players[j].characterId]++;
      }
    }
  }

  var rivalsCharId = rivalCharUsage.indexOf(Math.max(...rivalCharUsage));

  var colorArr = new Array(6).fill(0);

  for (let i = 0; i < res.length; i++) {
    for (let j = 0; j < res[i].players.length; j++) {
      if(res[i].players[j].code === items[0][0] && res[i].players[j].characterId === rivalsCharId){
        colorArr[res[i].players[j].characterColor]++; 
      }
    }
  }

  var rivalsColorId = colorArr.indexOf(Math.max(...colorArr));

  var myMostUsedCharId = myCharUsage.indexOf(Math.max(...myCharUsage))
  var myColorArr = new Array(6).fill(0);

  for (let i = 0; i < res.length; i++) {
    for (let j = 0; j < res[i].players.length; j++) {
      if(res[i].players[j].code === connect_code && res[i].players[j].characterId === myMostUsedCharId){
        myColorArr[res[i].players[j].characterColor]++; 
      }
    }
  }

  var myColorId = myColorArr.indexOf(Math.max(...myColorArr));

  var vsRivalWin = 0;
  var vsRivalLoss = 0;

  for (let i = 0; i < res.length; i++) {
      if(res[i].players[0].code === items[0][0] || res[i].players[0].code === connect_code){
        if(res[i].players[1].code === items[0][0] || res[i].players[1].code === connect_code){
          if(res[i].metadata.winner === connect_code){
            vsRivalWin++;
          }else if(res[i].metadata.winner === items[0][0]){
            vsRivalLoss++;
          }
        }
      }
    }
  

  // Match durations
  if(longestGametime === shortestGametime){
    shortestGametime = 0;
  }

  var timerange = longestGametime - shortestGametime;
  var range = Math.ceil(timerange / 10);

  const _ = require("lodash");            
    
  // Using the _.range() method 
  let range_arr = _.range(shortestGametime, longestGametime, range); 

  range_arr.push(range_arr[range_arr.length - 1]+range)

  function between(x, min, max) {
    return x >= min && x <= max;
  }

  var winrange = new Array(10).fill(0);

  var lossrange = new Array(10).fill(0);

  for (let i = 0; i < res.length; i++) {
    if(res[i].metadata.winner === connect_code){
      for (let j = 0; j < winrange.length; j++) {
        if(between(res[i].metadata.lastFrame, range_arr[j], range_arr[j+1])){
          winrange[j]++
        }        
      }
    }else if(res[i].metadata.winner !== connect_code && res[i].metadata.winner !== 'INCOMPLETE' && res[i].metadata.winner !== 'DRAW'){
      for (let j = 0; j < lossrange.length; j++) {
        if(between(res[i].metadata.lastFrame, range_arr[j], range_arr[j+1])){
          lossrange[j]++
        }        
      }
    }
  }

  var rangewinrate = []
  var totalranges = new Array(10).fill(0);
  
  for (let i = 0; i < winrange.length; i++) {
    rangewinrate[i] = (winrange[i] / (winrange[i] + lossrange[i])) * 100;
    totalranges[i] = winrange[i] + lossrange[i];
  }


  var oneAndDone = 0

  for (let i = 0; i < items.length; i++) {
    if(items[i][1] === 1){
      oneAndDone++;
    }
  }

  var quitoutmyCharUsagePercent = new Array(26).fill(0);
  var quitoutmyOppCharUsagePercent = new Array(26).fill(0);

  for (let i = 0; i < quitoutmyCharUsage.length; i++) {
    quitoutmyCharUsagePercent[i] = quitoutmyCharUsage[i] / myCharUsage[i] ? parseInt((quitoutmyCharUsage[i] / myCharUsage[i])*100) : 0;
    quitoutmyOppCharUsagePercent[i] = quitoutmyOppCharUsage[i] / myOppCharUsage[i] ? parseInt((quitoutmyOppCharUsage[i] / myOppCharUsage[i]) * 100) : 0;
  }

  var resObj = {
    // Summary
    totalMatches: myTotalMatches,
    totalTime: myTotalTime,
    totalLRAStart: myTotalLRAStart,
    totalTimeouts: myTotalTimeouts,
    totalWins: myTotalWins,
    totalLosses: myTotalLosses,
    winrate: myWinrate,

    // Character Usage
    charUsage : myCharUsage,
    oppCharUsage : myOppCharUsage,

    // Characters W/L
    vsCharWins : myVsCharWins,
    vsCharLoss : myVsCharLoss,

    asCharWins : myAsCharWins,
    asCharLoss : myAsCharLoss,

    stageWins : myStageWins,
    stageLoss : myStageLoss,

    // Efficiency
    neutralWins : myNeutralWins,
    oppNeutralWins : myOppNeutralWins,

    counterHits : myCounterHits,
    oppCounterHits : myOppCounterHits,

    beneficialTrades : myBeneficialTrades,
    oppBeneficialTrades : myOppBeneficialTrades,

    openings: myOpenings,
    oppOpenings: myOppOpenings,

    kills: myKills,
    oppKills: myOppKills,

    openingsPerKO : myOpeningsPerKO,
    oppOpeningsPerKO : myOppOpeningsPerKO,

    conversions: myConversions,
    oppConversions: myOppConversions,

    successfulConversions: mySuccessfulConversions,
    oppSuccessfulConversions: myOppSuccessfulConversions,

    conversionRate : myConversionRate,
    oppConversionRate : myOppConversionRate,

    damage: myDamage,
    oppDamage: myOppDamage,

    avgDamagePerOpening : myAvgDamagePerOpening,
    oppAvgDamagePerOpening : myOppAvgDamagePerOpening,

    avgKOpercent : myAvgKOpercent,
    oppAvgKOpercent : myOppAvgKOpercent,

    lcancels : myLcancels,
    oppLcancels : myOppLcancels,

    // Stocks
    fourStocks : myFourStocks,
    oppFourStocks : myOppFourStocks,

    avgStocksTaken : myAvgStocksTaken,
    oppAvgStocksTaken : myOppAvgStocksTaken,

    avgStockDifferential : myAvgStockDifferential,
    oppAvgStockDifferential : myOppAvgStockDifferential,

    firstBloods : myFirstBloods,
    oppFirstBloods : myOppFirstBloods,

    bestPunish : myBestPunish,
    oppBestPunish : myOppBestPunish,

    lowestKill : myLowestKill,
    oppLowestKill : myOppLowestKill,

    highestKill : myHighestKill,
    oppHighestKill : myOppHighestKill,

    // IPM
    inputsPM : myIPM,
    oppIPM : myOppIPM,

    digitalIPM : myDigitalIPM,
    oppDigitalIPM : myOppDigitalIPM,

    actionCountArr : myActionCountArr,
    oppActionCountArr : myOppActionCountArr,

    // Move Usage
    moveUsageArr : myMoveUsageArr,
    oppMoveUsageArr : myOppMoveUsageArr,

    // Teams
    rival : items[0][0],
    rivalCharUsage: rivalCharUsage,
    rivalsCharId: rivalsCharId,
    rivalsColorId: rivalsColorId,
    vsRivalWin: vsRivalWin,
    vsRivalLoss: vsRivalLoss,

    // Match duration
    shortestGametime: shortestGametime,
    longestGametime: longestGametime,

    timeRanges: range_arr,
    timeRangeWinrate: rangewinrate,

    // Quit outs
    quitoutChars: quitoutmyCharUsage,
    oppQuitoutChars: quitoutmyOppCharUsage,
    quitoutPercent: quitoutmyCharUsagePercent,
    quitoutOppPercent: quitoutmyOppCharUsagePercent,

    // opponents
    uniqueOpps: items.length,
    oneAndDoned: oneAndDone,

    // death direction
    deathDirectionCharUsage: deathDirectionCharUsage,
    deathDirectionOppCharUsage: deathDirectionOppCharUsage,

    // grab
    grabCountSuccessCharUsage: grabCountSuccessCharUsage,
    grabCountWhiffCharUsage: grabCountWhiffCharUsage,

    grabCountSuccessOppCharUsage: grabCountSuccessOppCharUsage,
    grabCountWhiffOppCharUsage: grabCountWhiffOppCharUsage,

    // throws
    throwCountCharUsage: throwCountCharUsage,
    throwCountOppCharUsage: throwCountOppCharUsage,

    // ground tech
    groundTechCountCharUsage: groundTechCountCharUsage,
    groundTechCountOppCharUsage: groundTechCountOppCharUsage,

    // wall tech
    wallTechCountSuccessCharUsage: wallTechCountSuccessCharUsage,
    wallTechCountFailCharUsage: wallTechCountFailCharUsage,

    wallTechCountSuccessOppCharUsage: wallTechCountSuccessOppCharUsage,
    wallTechCountFailOppCharUsage: wallTechCountFailOppCharUsage,

    // credited kills

    creditedKills: myCreditedKills,
    oppCreditedKills: myOppCreditedKills,

    sdCharUsage: sdCharUsage,
    sdOppCharUsage: sdOppCharUsage,

    totalranges: totalranges,

    deathUsage: deathUsage,
    deathOppUsage: deathOppUsage,

    main: myMostUsedCharId,
    mainColor: myColorId,

    zeroToDeaths: zeroToDeaths,
    oppZeroToDeaths: oppZeroToDeaths
  }

  return resObj
}

exports.create = (req, res) => {
  // File storage location and naming
  var R_DIR = DIR + "/" + uuidv4();
  fs.mkdir(R_DIR, function(err){});

  var files = 0, finished = false;

  req.busboy.on('file', (fieldname, file, filename) => {
      console.log(`Upload started: %s`, filename);
      files++;

      // Create a write stream of the new file
      const fstream = fs.createWriteStream(path.join(R_DIR, filename));
      
      // Pipe it trough
      
      file.on('error',function(err){
       console.log('fstream: ', err);
      });
            
      file.on('end', function() {
        fstream.end();
        console.log('Finished uploading: %s', filename );
      });

      fstream.on('finish', function(){   
        if(--files === 0 && finished){
          
          fs.readdir(R_DIR, (err, files) => {
            console.log(files.length); 
          });  

          parse_folder(R_DIR, res); 
          rimraf.sync(R_DIR);
        }
      });

      fstream.on('close', function(){
        if(files === 0 && finished){
          console.log('fstream closed')
        }
      });

      fstream.on('error', function(){
          console.log('fstream error')       
      });


      file.pipe(fstream)

  }); // busboy on file

  req.busboy.on('finish', function() {
    finished = true;
  });

  req.busboy.on('error', function() {
    console.log('busboy error')
  });

  req.connection.on('error', function (error) {
    //do something like cancelling the mongodb session ...
    console.log('connection error')
    parse_folder(R_DIR, res); 
    rimraf.sync(R_DIR);
});

  return req.pipe(req.busboy); // Pipe it trough busboy
}

// Retrieve all matches from the database 
exports.findAll = (req, res) => {
  let playerArr = [];

  code = req.query.code;
  let mycode = code ? code.replace("-", "#") : "";
  mycode ? playerArr.push(mycode) : {} ;

  oppcode = req.query.oppcode;
  let myoppcode = oppcode ? oppcode.replace("-", "#") : "" ;
  myoppcode ? playerArr.push(myoppcode) : {} ;

  let chararr = [
    "CAPTAIN_FALCON","DONKEY_KONG","FOX" ,"GAME_AND_WATCH","KIRBY",
    "BOWSER","LINK","LUIGI","MARIO","MARTH","MEWTWO","NESS","PEACH",
    "PIKACHU","ICE_CLIMBERS","JIGGLYPUFF","SAMUS","YOSHI","ZELDA",
    "SHEIK","FALCO","YOUNG_LINK","DR_MARIO","ROY","PICHU","GANONDORF"
  ]

  let stagearr = [
    "FOUNTAIN_OF_DREAMS","POKEMON_STADIUM","YOSHIS_STORY","DREAMLAND",
    "BATTLEFIELD","FINAL_DESTINATION"
  ]

  let completearr = [true,false];

  let characters = [];
  characters = req.query.character !== undefined ? req.query.character : chararr;
  if(!Array.isArray(characters)){
    characters = [characters];
  }

  let oppcharacters = [];
  oppcharacters = req.query.oppcharacter !== undefined ? req.query.oppcharacter : chararr;
  if(!Array.isArray(oppcharacters)){
    oppcharacters = [oppcharacters];
  }

  let stages = "";
  stages = req.query.stage !== undefined ? req.query.stage : stagearr;

  let complete = "";
  complete = req.query.complete !== undefined ? req.query.complete : completearr;
  if(!Array.isArray(complete)){
    complete = [Boolean(complete)];
  }

  let startdate = req.query.start ? req.query.start : "2001";

  let enddate = req.query.end ? new Date(req.query.end): new Date();

  

  Match.find({
    'players.code':{ $all: playerArr },
    'players' : {$all: [{ $elemMatch : {code: mycode, characterString: {$in : characters} }},
      { $elemMatch : {code: {$ne: mycode}, characterString: {$in : oppcharacters } }}]},
    'settings.stageString' : {$in: stages},
    'metadata.gameComplete': {$in: complete},
    'metadata.startAt' : {
      $gte: startdate,
      $lte: enddate
    }
  }).lean().map(function(u) {return u})
    .then(data => {      
      res.send(getStats(mycode, data));
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving matches."
      });
    });
};

exports.getTotal = (req, res) => {
  Match.aggregate([
    [
      {
        '$count': 'matchId'
      }
    ]
  ]).then(data => {
    res.send(data)
  })
}

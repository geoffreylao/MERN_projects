import React, { Component } from "react";
import MatchDataService from "../services/match.service";
import ReactSpinner from 'react-bootstrap-spinner'
import Select from 'react-select'

import 'react-dates/initialize';
import { DateRangePicker } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';

function arrayTally(arr){
  var thingToTally = [];
  var occurences = [];
  var prev;

  arr.sort();
  for (let i = 0; i < arr.length; i++) {
    if(arr[i] !== prev){
      thingToTally.push(arr[i]);
      occurences.push(1);
    } else {
      occurences[occurences.length - 1]++;
    }        
    prev = arr[i];
  }
  return [thingToTally,occurences];
}

function myCharColor(connect_code, res){
  var charArr = []

  for (let i = 0; i < res.length; i++) {
    if(res[i].players[0].code === connect_code){
      var charId = res[i].players[0].characterId
    } 
    
    if(res[i].players[1].code === connect_code){
      charId = res[i].players[1].characterId
    }
    charArr.push(charId);  
  }

  var charResult = arrayTally(charArr);

  var myMostUsedCharId = charResult[0][charResult[1].indexOf(Math.max(...charResult[1]))]

  var colorArr = []

  for (let i = 0; i < res.length; i++) {
    if(res[i].players[0].code === connect_code && res[i].players[0].characterId === myMostUsedCharId){
      var charColor = res[i].players[0].characterColor
      colorArr.push(charColor); 
    } 
    
    if(res[i].players[1].code === connect_code && res[i].players[1].characterId === myMostUsedCharId){
      charColor = res[i].players[1].characterColor
      colorArr.push(charColor); 
    }    
  }

  var coloResult = arrayTally(colorArr);
  var myMostUsedColorId = coloResult[0][coloResult[1].indexOf(Math.max(...coloResult[1]))];

  return [myMostUsedCharId, myMostUsedColorId];
}

function showTwoDigits(number) {
  return ("00" + number).slice(-2);
}

function displayTime(currentFrame) {
  var fps = 60;
  var h = Math.floor(currentFrame/(60*60*fps));
  var m = (Math.floor(currentFrame/(60*fps))) % 60;
  var s = (Math.floor(currentFrame/fps)) % 60;
  var f = currentFrame % fps;
  return showTwoDigits(h) + ":" + showTwoDigits(m) + ":" + showTwoDigits(s) + ":" + showTwoDigits(f);
}

function getStats(connect_code, res){
  // Char array Tier List Sorted
  var tierListArr = [
    2, 9, 15, 20, // Fox, Marth, Puff, Falco
    19, 0, 12, // Sheik, Falcon, Peach
    14, 13, 17, 16, // Ic, Pika, Yoshi, Samus
    7, 22, // Luigi, Doc
    25, 8, // Ganon, Mario
    1, 21, 6, 3, // DK, YL, Link, G&W
    10, 23, 24, 11, 18, // Mew2, Roy, Pichu, Ness, Zelda
    4, 5 // Kirby, Bowser
  ];

  // Stages W/L
  var stageArr = [
    "FOUNTAIN_OF_DREAMS","POKEMON_STADIUM","YOSHIS_STORY",
    "DREAMLAND","BATTLEFIELD","FINAL_DESTINATION"
  ]

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
  myActionCountArr = new Array(7).fill(0);
  myOppActionCountArr = new Array(7).fill(0);

  myMoveUsageArr = {
    neutralWinMoves : new Array(63).fill(0),
    counterHitMoves : new Array(63).fill(0),
    tradeMoves : new Array(63).fill(0),
    killMoves : new Array(63).fill(0)
  }

  myOppMoveUsageArr = {
    neutralWinMoves : new Array(63).fill(0),
    counterHitMoves : new Array(63).fill(0),
    tradeMoves : new Array(63).fill(0),
    killMoves : new Array(63).fill(0)
  }

  // Total Matches

  
  var frames = 0;

  for (let i = 0; i < res.length; i++) {
      myTotalMatches++;

      frames += res[i].metadata.lastFrame;
  
      myTotalMinutes += res[i].metadata.minutes;
  
      if(res[i].metadata.firstBlood === connect_code){
        myFirstBloods++;
      }else{
        myOppFirstBloods++;
      }
  
      // Total L R A Start
      if(res[i].metadata.gameComplete === false){
        myTotalLRAStart++;
      }
  
      // Total Timeouts
      if(res[i].metadata.lastframe === 28800){
        myTotalTimeouts++;
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
          myConversions += res[i].players[j].conversionCount;
          mySuccessfulConversions += res[i].players[j].successfulConversions;
          myDamage += res[i].players[j].totalDamage;
          myTotalInputs += res[i].players[j].inputCounts.total;
          myTotalDigitalInputs += res[i].players[j].inputCounts.buttons;
  
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
              if(res[i].players[j].conversions[k].moves[0])
                {myMoveUsageArr.killMoves[res[i].players[j].conversions[k].moves[res[i].players[j].conversions[k].moves.length - 1].moveId]++;}
              

              if(res[i].players[j].conversions[k].endPercent > myHighestKill){
                myHighestKill = res[i].players[j].conversions[k].endPercent;
              }else if(res[i].players[j].conversions[k].endPercent < myLowestKill){
                myLowestKill = res[i].players[j].conversions[k].endPercent;
              }
            }
  
            switch(res[i].players[j].conversions[k].openingType){
              case 'neutral-win': 
              if(res[i].players[j].conversions[k].moves[0])
                {myMoveUsageArr.neutralWinMoves[res[i].players[j].conversions[k].moves[0].moveId]++;}
                break;
              case 'counter-attack':
                if(res[i].players[j].conversions[k].moves[0])
                {myMoveUsageArr.counterHitMoves[res[i].players[j].conversions[k].moves[0].moveId]++;}
                break;
              case 'trade':
                if(res[i].players[j].conversions[k].moves[0])
                {myMoveUsageArr.tradeMoves[res[i].players[j].conversions[k].moves[0].moveId]++;}
                break;
              default:
                break;
            }
          }
  
          // Action Counts
          myActionCountArr[0] +=  res[i].players[j].actionCounts.wavedashCount;
          myActionCountArr[1] +=  res[i].players[j].actionCounts.wavelandCount;
          myActionCountArr[2] +=  res[i].players[j].actionCounts.airDodgeCount;
          myActionCountArr[3] +=  res[i].players[j].actionCounts.dashDanceCount;
          myActionCountArr[4] +=  res[i].players[j].actionCounts.spotDodgeCount;
          myActionCountArr[5] +=  res[i].players[j].actionCounts.ledgegrabCount;
          myActionCountArr[6] +=  res[i].players[j].actionCounts.rollCount;
  
        }else{
          myOppCharUsage[res[i].players[j].characterId]++;
          myOppNeutralWins += res[i].players[j].neutralWins;
          myOppCounterHits += res[i].players[j].counterHits;
          myOppBeneficialTrades += res[i].players[j].trades;
          myOppOpenings += res[i].players[j].openings;
          myOppKills += res[i].players[j].killCount;
          myOppConversions += res[i].players[j].conversionCount;
          myOppSuccessfulConversions += res[i].players[j].successfulConversions;
          myOppDamage += res[i].players[j].totalDamage;
          myOppTotalInputs += res[i].players[j].inputCounts.total;
          myOppTotalDigitalInputs += res[i].players[j].inputCounts.buttons;
  
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
              if(res[i].players[j].conversions[k].moves[0])
              {myOppMoveUsageArr.killMoves[res[i].players[j].conversions[k].moves[res[i].players[j].conversions[k].moves.length - 1].moveId]++;}
              if(res[i].players[j].conversions[k].endPercent > myHighestKill){
                myOppHighestKill = res[i].players[j].conversions[k].endPercent;
              }else if(res[i].players[j].conversions[k].endPercent < myLowestKill){
                myOppLowestKill = res[i].players[j].conversions[k].endPercent;
              }
            }
  
            switch(res[i].players[j].conversions[k].openingType){
              case 'neutral-win': 
              if(res[i].players[j].conversions[k].moves[0])
               { myOppMoveUsageArr.neutralWinMoves[res[i].players[j].conversions[k].moves[0].moveId]++;}
                break;
              case 'counter-attack':
                if(res[i].players[j].conversions[k].moves[0])
                {myOppMoveUsageArr.counterHitMoves[res[i].players[j].conversions[k].moves[0].moveId]++;}
                break;
              case 'trade':
                if(res[i].players[j].conversions[k].moves[0])
                {myOppMoveUsageArr.tradeMoves[res[i].players[j].conversions[k].moves[0].moveId]++;}
                break;
              default:
                break;
            }
    
          }
  
          // Action Counts
          myOppActionCountArr[0] +=  res[i].players[j].actionCounts.wavedashCount;
          myOppActionCountArr[1] +=  res[i].players[j].actionCounts.wavelandCount;
          myOppActionCountArr[2] +=  res[i].players[j].actionCounts.airDodgeCount;
          myOppActionCountArr[3] +=  res[i].players[j].actionCounts.dashDanceCount;
          myOppActionCountArr[4] +=  res[i].players[j].actionCounts.spotDodgeCount;
          myOppActionCountArr[5] +=  res[i].players[j].actionCounts.ledgegrabCount;
          myOppActionCountArr[6] +=  res[i].players[j].actionCounts.rollCount;
        }
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
  myAvgStockDifferential = myTotalStockDifferential / myTotalWins;
  myOppAvgStockDifferential = myOppTotalStockDifferential / myTotalLosses;

  // IPM
  myIPM = myTotalInputs / myTotalMinutes;
  myOppIPM = myOppTotalInputs / myTotalMinutes;

  myDigitalIPM = myTotalDigitalInputs / myTotalMinutes;
  myOppDigitalIPM = myOppTotalDigitalInputs / myTotalMinutes;

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
    oppMoveUsageArr : myOppMoveUsageArr
  }

  return resObj;
}

export default class MatchesList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchCode = this.onChangeSearchCode.bind(this);
    this.searchCode = this.searchCode.bind(this);
    this.onChangeOppCode = this.onChangeOppCode.bind(this);
    this.onChangeOnlyComplete = this.onChangeOnlyComplete.bind(this);

    this.state = {
      // search params
      searchCode: "",
      oppCode: "",
      selectCharacters: [],
      myCharValue: [],
      oppCharValue: [],
      selectStages: [],
      stageValue: [],
      isOnlyComplete: false,
      startDate: null,
      endDate: null,

      // data
      myMain: "",
      myStats: ""
    };
  }

  async getCharacters(){
    let chararr = [
      "BOWSER","CAPTAIN_FALCON","DONKEY_KONG","DR_MARIO",
      "FALCO","FOX","GAME_AND_WATCH","GANONDORF","ICE_CLIMBERS",
      "JIGGLYPUFF","KIRBY","LINK","LUIGI","MARIO","MARTH","MEWTWO",
      "NESS","PEACH","PICHU","PIKACHU","ROY","SAMUS","SHEIK","YOSHI",
      "YOUNG_LINK","ZELDA"
    ]

    let charpng = [
      "Bowser.png","Captain Falcon.png","Donkey Kong.png","Dr. Mario.png",
      "Falco.png","Fox.png","Game & Watch.png","Ganondorf.png","Ice Climbers.png",
      "Jigglypuff.png","Kirby.png","Link.png","Luigi.png","Mario.png","Marth.png","Mewtwo.png",
      "Ness.png","Peach.png","Pichu.png","Pikachu.png","Roy.png","Samus.png","Sheik.png","Yoshi.png",
      "Young Link.png","Zelda.png"
    ]
    
    const characters = chararr.map((x,i) => ({
      "value": x,
      "label": <div><img src={`stock_icons/${charpng[i]}`} height="30px" width="30px" alt=""/> {charpng[i].split('.').slice(0, -1).join('.')}</div>
    }))

    this.setState({selectCharacters: characters})
  }

  async getStages(){
    let stagearr = [
      "FOUNTAIN_OF_DREAMS","POKEMON_STADIUM","YOSHIS_STORY","DREAMLAND",
      "BATTLEFIELD","FINAL_DESTINATION"
    ]

    let stagepng = [
      "Fountain of Dreams.png","Pokemon Stadium.png","Yoshis Story.png","Dreamland.png",
      "Battlefield.png","Final Destination.png"
    ]

    const stages = stagearr.map((x,i) => ({
      "value": x,
      "label": <div><img src={`stage_icons/${stagepng[i]}`} height="30px" width="30px" alt=""/> {stagepng[i].split('.').slice(0, -1).join('.')}</div>
    }))

    this.setState({selectStages: stages})
  }

  myCharChange(e){
    this.setState({myCharValue: e})
  }

  myOppChange(e){
    this.setState({oppCharValue: e})
  }

  stageChange(e){
    this.setState({stageValue: e})
  }
   
  componentDidMount() {
    this.getCharacters();
    this.getStages();
  }

  onChangeSearchCode(e) {
    const searchCode = e.target.value;

    this.setState({
      searchCode: searchCode
    });
  }

  onChangeOppCode(e) {
    const oppCode = e.target.value;

    this.setState({
      oppCode: oppCode
    });
  }

  onChangeOnlyComplete(e) {
    const isOnlyComplete = e.target.checked;

    this.setState({
      isOnlyComplete: isOnlyComplete
    })
  }


  searchCode() {
    
    let mycode = this.state.searchCode.replace("#", "-").toUpperCase();
    let myoppcode = this.state.oppCode.replace("#", "-").toUpperCase();

    this.setState({
      statsLoaded: "loading"
    });

    let params = new URLSearchParams(`code=${mycode}`)
    
    if(myoppcode){
      params.append('oppcode', myoppcode);
    }

    for (let i = 0; i < this.state.myCharValue.length; i++) {
      params.append('character', this.state.myCharValue[i].value);
    }

    for (let i = 0; i < this.state.oppCharValue.length; i++) {
      params.append('oppcharacter', this.state.oppCharValue[i].value);
    }

    for (let i = 0; i < this.state.stageValue.length; i++) {
      params.append('stage', this.state.stageValue[i].value);
    }

    if(this.state.isOnlyComplete){
      params.append('complete', true)
    }

    if(this.state.startDate){
      params.append('start', (this.state.startDate._d).toISOString())
    }

    if(this.state.endDate){
      params.append('end', (this.state.endDate._d).toISOString())
    }

    MatchDataService.findByCode(params.toString())
      .then(response => {
        this.setState({
          matches: response.data,
          statsLoaded: "loaded",
          myMain: myCharColor(this.state.searchCode, response.data),
          myStats: getStats(this.state.searchCode, response.data)
        });
        
        console.log(getStats(this.state.searchCode, response.data));     
      })
      .catch(e => {
        this.setState({
          statsLoaded: "error"
        });
      }); 
  }

  render() {
    const { searchCode, statsLoaded, oppCode, myMain, myStats } = this.state;

    const renderStats = () => {
      if (statsLoaded === "loaded") {
        return(
          <div className="col-md-12">
            <h4>Stats</h4>
            <div id="container">
                <img src="cssp1bg.png" width="272" height="376" alt=""/>
                <img src={`char_portraits/${myMain[0]}/${myMain[1]}.png`} width="272" height="376" alt=""/>
                <img src="cssp1.png" width="272" height="376" alt=""/>
            </div>
          </div>
        )
      }
      else if (statsLoaded === "loading")
      {
        return(
          <div>
            <div><ReactSpinner type="border" color="primary" size="5" /></div>
          </div>
        )
      }
    };

    return (
      <div className="list row">
        <div className="col-md-12">
            <input
              type="text"
              className="form-control"
              placeholder="Your Connect Code"
              value={searchCode}
              onChange={this.onChangeSearchCode}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Your Opponents Code"
              value={oppCode}
              onChange={this.onChangeOppCode}
            />
            <div>
              <Select 
                menuPortalTarget={document.body} 
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 })}} 
                options={this.state.selectCharacters} 
                onChange={this.myCharChange.bind(this)} 
                isMulti 
              />
            </div>
            <div>
              <Select 
                menuPortalTarget={document.body} 
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 })}} 
                options={this.state.selectCharacters} 
                onChange={this.myOppChange.bind(this)} 
                isMulti 
              />
            </div>
            <div>
              <Select 
                menuPortalTarget={document.body} 
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 })}} 
                options={this.state.selectStages} 
                onChange={this.stageChange.bind(this)} 
                isMulti 
              />
            </div>
            <label>
              <input
                name="isOnlyComplete"
                type="checkbox"
                value={this.state.isOnlyComplete}
                onChange={this.onChangeOnlyComplete}
              />
                Exclude games ending in LRA Start
            </label>
            <div>
            <DateRangePicker
              startDate={this.state.startDate} // momentPropTypes.momentObj or null,
              startDateId="your_unique_start_date_id" // PropTypes.string.isRequired,
              endDate={this.state.endDate} // momentPropTypes.momentObj or null,
              endDateId="your_unique_end_date_id" // PropTypes.string.isRequired,
              onDatesChange={({ startDate, endDate }) => this.setState({ startDate, endDate })} // PropTypes.func.isRequired,
              focusedInput={this.state.focusedInput} // PropTypes.oneOf([START_DATE, END_DATE]) or null,
              onFocusChange={focusedInput => this.setState({ focusedInput })} // PropTypes.func.isRequired,
              isOutsideRange={() => false}
            />
            </div>
            <div className="input-group-append">
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={this.searchCode}
              >
                Search
              </button>
            </div>
        </div>
        <div className="col-md-12">
          {renderStats()}
        </div>
      </div>
    );
  }

}
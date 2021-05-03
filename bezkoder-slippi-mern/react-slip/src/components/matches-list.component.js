import React, { Component } from "react";
import MatchDataService from "../services/match.service";
import ReactSpinner from 'react-bootstrap-spinner'
import Select from 'react-select'

import 'react-dates/initialize';
import { DateRangePicker } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';

export default class MatchesList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchCode = this.onChangeSearchCode.bind(this);
    this.setActiveMatch = this.setActiveMatch.bind(this);
    this.searchCode = this.searchCode.bind(this);
    this.onChangeOppCode = this.onChangeOppCode.bind(this);
    this.onChangeOnlyComplete = this.onChangeOnlyComplete.bind(this);

    this.state = {
      matches: [],
      matchesLoading: "",
      currentMatch: null,
      currentIndex: -1,
      searchCode: "",
      oppCode: "",
      selectCharacters: [],
      myCharValue: [],
      oppCharValue: [],
      selectStages: [],
      stageValue: [],
      isOnlyComplete: false,
      startDate: null,
      endDate: null
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

  setActiveMatch(match, index) {
    this.setState({
      currentMatch: match,
      currentIndex: index
    });
  }

  searchCode() {
    
    let mycode = this.state.searchCode.replace("#", "-");
    let myoppcode = this.state.oppCode.replace("#", "-");

    this.setState({
      matchesLoaded: "loading"
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
          matchesLoaded: "loaded"
        });
        console.log(response.data);
      })
      .catch(e => {
        this.setState({
          matchesLoaded: "error"
        });
      }); 
  }

  render() {
    const { searchCode, matches, matchesLoaded, currentMatch, currentIndex, oppCode } = this.state;
    
    const renderMatchList = () => {
      if (matchesLoaded === "loaded") {
        return(
          <ul className="list-group">
            {matches &&
              matches.map((match, index) => (
                <li
                  className={
                    "list-group-item " +
                    (index === currentIndex ? "active" : "")
                  }
                  onClick={() => this.setActiveMatch(match, index)}
                  key={index}
                >
                  {match.metadata.winner}
                </li>
              ))}
          </ul>
        )
      }
      else if (matchesLoaded === "loading")
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
        <div className="col-md-8">
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
        <div className="col-md-6">
          <h4>Matches List</h4>
          {renderMatchList()}
        </div>
        <div className="col-md-6">
          {currentMatch ? (
            <div>
              <h4>match</h4>
              <div>
                <label>
                  <strong>players.code 1:</strong>
                </label>{" "}
                {currentMatch.players[0].code}
              </div>
              <div>
                <label>
                  <strong>players.code 2:</strong>
                </label>{" "}
                {currentMatch.players[1].code}
              </div>
              <div>
                <label>
                  <strong>players.chracterString 1:</strong>
                </label>{" "}
                {currentMatch.players[0].characterString}
              </div>
              <div>
                <label>
                  <strong>players.chracterString 2:</strong>
                </label>{" "}
                {currentMatch.players[1].characterString}
              </div>
              <div>
                <label>
                  <strong>settings.stageString:</strong>
                </label>{" "}
                {currentMatch.settings.stageString}
              </div>
              <div>
                <label>
                  <strong>metadata.game_complete:</strong>
                </label>{" "}
                {currentMatch.metadata.game_complete.toString()}
              </div>
              <div>
                <label>
                  <strong>metadata.startAt:</strong>
                </label>{" "}
                {currentMatch.metadata.startAt.toString()}
              </div>
            </div>
          ) : (
            <div>
              <br />
              <p>Please click on a match...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

}
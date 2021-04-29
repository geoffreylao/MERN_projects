import React, { Component } from "react";
import MatchDataService from "../services/match.service";
import ReactSpinner from 'react-bootstrap-spinner'

export default class MatchesList extends Component {
  constructor(props) {
    super(props);
    this.onChangeSearchCode = this.onChangeSearchCode.bind(this);
    this.setActiveMatch = this.setActiveMatch.bind(this);
    this.searchCode = this.searchCode.bind(this);
    this.onChangeOppCode = this.onChangeOppCode.bind(this);

    this.state = {
      matches: [],
      matchesLoading: "",
      currentMatch: null,
      currentIndex: -1,
      searchCode: "",
      oppCode: ""
    };
  }

  componentDidMount() {
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
          <div className="input-group mb-3">
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
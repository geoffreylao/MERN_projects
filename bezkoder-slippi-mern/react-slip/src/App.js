import React, { Component } from "react";
import { Switch, Route, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import AddMatch from "./components/add-match.component";
import MatchStats from "./components/match-stats.component";

class App extends Component {
  render() {
    return (
      <div>
        <nav className="navbar navbar-expand navbar-dark bg-secondary">
          <a href="/matches" className="navbar-brand">
          <img src="slippicharts.png" className="img-fluid" width="48" height="48" alt=""></img>
                  Chart.slp
          </a>
          <div className="navbar-nav mr-auto">
            <li className="nav-item">
              <Link to={"/matches"} className="nav-link">
                GENERATE CHARTS
              </Link>
            </li>
            <li className="nav-item">
              <Link to={"/add"} className="nav-link">
                UPLOAD GAMES
              </Link>
            </li>
          </div>
        </nav>

        <div className="container mt-3">
          <Switch>
            <Route exact path={["/", "/matches"]} component={MatchStats} />
            <Route exact path="/add" component={AddMatch} />
          </Switch>
        </div>
      </div>
    );
  }
}

export default App;

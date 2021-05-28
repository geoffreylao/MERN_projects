import React, { Component } from "react";
import MatchDataService from "../services/match.service";
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';

function makeUL(array){
  // Create the list element:
  var list = document.createElement('ul');

  for (let i = 0; i < array.length; i++) {
    // create the list item:
    var item = document.createElement('li');
    
    // set its contents:
    item.appendChild(document.createTextNode(array[i]));

    // add it to the list:
    list.appendChild(item);
  }

  return list;
}

export default class AddMatch extends Component {
  constructor(props) {
    super(props);

    this.onFileChange = this.onFileChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.state = {
      matchesCollection: ''
    }
}

  onFileChange(e) {
      this.setState({ matchesCollection: e.target.files })
  }

  onSubmit(e) {
    document.getElementById("failedarr").innerHTML = "";
    e.preventDefault()

    var formData = new FormData();
    for (const key of Object.keys(this.state.matchesCollection)) {
        formData.append('matchesCollection', this.state.matchesCollection[key])
    }
    MatchDataService.create(formData).then((res) => {
        console.log(res)
        document.getElementById("inserted").innerHTML = (res.data.inserted ? "Inserted: " + res.data.inserted : "");
        document.getElementById("failed").innerHTML = "Failed: " + res.data.failed_arr.length;
        document.getElementById("failedarr").appendChild(makeUL(res.data.failed_arr));
    }, (error) => {
      console.log(error);
    });

    document.getElementById("FileSlp").value = "";
  }

  render() {
    return (
        <div className="container">
            <div className="row">
              <form onSubmit={this.onSubmit} enctype="multipart/form-data">
                <div className="form-group">
                    <input type="file" accept="application/x-zip-compressed,.slp" name="matchesCollection" id="FileSlp" onChange={this.onFileChange} multiple />
                </div>
                <div className="form-group">
                    <button className="btn btn-primary" type="submit">Upload</button>
                </div>
                <div>
                  <div id ="my_accordion">
                    <Accordion defaultActiveKey="1">
                      <Card.Header>
                        <h3 id="inserted"> </h3>
                      </Card.Header>
                      <Card>
                        <Accordion.Toggle as={Card.Header} eventKey="0">
                          <h3 id="failed"> </h3>
                        </Accordion.Toggle>
                        <Accordion.Collapse eventKey="0">
                          <Card.Body><div id="failedarr"> </div></Card.Body>
                        </Accordion.Collapse>
                      </Card>
                    </Accordion>
                  </div>
                  {/* <h2 id="failed"> </h2>
                  <div id="failedarr"> </div> */}
                </div>
              </form>
            </div>
        </div>
      )
    }
}
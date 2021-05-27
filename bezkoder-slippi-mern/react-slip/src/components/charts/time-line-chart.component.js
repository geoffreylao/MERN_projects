import React, { Component } from 'react';
import { Line } from 'react-chartjs-2';

function showTwoDigits(number) {
  return ("00" + number).slice(-2);
}

function displayTime(currentFrame) {
  var fps = 60;

  var m = Math.floor(currentFrame / (60 * fps)) % 60;
  var s = Math.floor(currentFrame / fps) % 60;

  return showTwoDigits(m) + ":" + showTwoDigits(s);
}

export default class TimeLineChart extends Component {
  render() {
    var labelsarr = [];

    for (let i = 0; i < this.props.rangearr.length - 1; i++) {
      labelsarr.push(displayTime(this.props.rangearr[i]) + "-" + displayTime(this.props.rangearr[i + 1]));
    }

    return (
      <div>
        <Line 
        data ={{     
          labels: labelsarr,
          datasets: [
            {
              label: "winrate",
              data: this.props.data,
              fill: false,
              backgroundColor: "rgb(255, 99, 132)",
              borderColor: "rgba(255, 99, 132, 0.2)"
            }
          ]            
        }}
        options={{
          scales: {
            yAxes: [
              {
                ticks: {
                  max: 100,
                  min: 0
                }
              }
            ]
          },
          spanGaps: true,
          legend:{
              display: false            
          },
          title: {
            display: true,
            text: "Winrate over Match Duration",
            fontSize: 20
          }
        }}
        />
      </div>
    );
  }
}


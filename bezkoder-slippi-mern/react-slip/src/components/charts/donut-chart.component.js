import React, { Component } from 'react';
import {Doughnut} from 'react-chartjs-2';
import "chartjs-plugin-doughnutlabel";
import "chartjs-plugin-labels";

export default class Donut extends Component {
  render() {
    var percent = this.props.percentage;
    var color = 'rgba(255, 99, 132, 1)';

    if (percent >= 50) {
      color = 'rgba(72, 219, 143, 1)';
    }

    return (
      <div>
        <Doughnut
          data={{
            labels: this.props.labels,
            datasets: [
              {
                label: 'winrate label',
                backgroundColor: [
                  'rgba(255, 99, 132, 0.2)',
                  'rgba(165, 247, 184, 0.5)',
                ],
                borderColor: [
                  'rgba(255, 99, 132, 1)',
                  'rgba(72, 219, 143, 1)'
                ],
                hoverBackgroundColor: [
                  'rgba(255, 99, 132, 0.3)',
                  'rgba(165, 247, 184, 0.7)',
                ],
                data: this.props.data
              }
            ]
          }}
          width={'140%'}
          height={'100%'}
          options={{
            tooltips: {enabled: false},
            title:{
              display:true,
              text: this.props.title,
              fontSize:20,
            },
            legend:{
              display:true,
              position:'bottom',
              reverse: true
            },
            plugins: {
              doughnutlabel: {
                labels: [
                  {                   
                    text: percent + '%',
                    font: {
                      size: '60'
                    },
                    color: color
                  }
                ]
              },
              labels: {
                render: 'image'
              }
            }
          }}
        />
      </div>
    );
  }
}
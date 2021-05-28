import React, { Component } from 'react';
import {Pie} from 'react-chartjs-2';
import "chartjs-plugin-labels";

export default class QuitoutPieChart extends Component {
  render(){
    return(
      <div>
        <Pie
          data={{
            labels: this.props.charLabels,
            datasets: [
              {
                label: this.props.title,
                backgroundColor: this.props.charbackgroundColor,
                borderColor: this.props.charborderColor,
                hoverBackgroundColor: this.props.charhoverBackgroundColor,
                data: this.props.charData
              }
            ]
          }}
          width={'100%'}
          height={'500%'}
          options={{   
            responsive: true,
            maintainAspectRatio: false,
            title:{
              display: true,
              text: this.props.title,
              fontSize: 20,
              position: 'top'
            },
            legend: {
              display: this.props.labelBool,
              position: 'left',
              labels: {
                boxWidth: 20,
              
              }
            },
            plugins: {
              labels: {
                render: "image",
                images: this.props.charImage
              }
            },
            tooltips: {
              callbacks: {
                label: function(tooltipItem, data) {
                  var dataset = data.datasets[tooltipItem.datasetIndex];

                  var currentValue = dataset.data[tooltipItem.index];
                  var oglabel = data.labels[tooltipItem.index];    
                  return oglabel + " : " + currentValue + "%";
                }
              }
            }
          }}
        />
      </div>
    )
  }
}
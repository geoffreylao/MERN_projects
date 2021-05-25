import React, { Component } from 'react';
import {HorizontalBar} from 'react-chartjs-2';
import "chartjs-plugin-labels";

export default class StageBarChart extends Component {
  render() {
    const plugins = [{
      afterDraw: chart => {
        let ctx = chart.chart.ctx; 
        ctx.save();
        let xAxis = chart.scales['x-axis-0'];
        let yAxis = chart.scales['y-axis-0'];
        yAxis.ticks.forEach((value, index) => {  
          let y = yAxis.getPixelForTick(index);      
          let image = new Image();
          image.src =  '/stage_icons/' + this.props.stageImage[index]

            ctx.drawImage(image, xAxis.left - 125, y - 48, image.width*.13, image.height*.13);

          
        });  
        ctx.restore();    
    }}];
  
    return (
<div>
        <HorizontalBar
          data={{
            labels: this.props.stageLabels,
            datasets: [
              {
                label: "Winrate %",
                data: this.props.stageData,
                backgroundColor: this.props.stagebackgroundColor,
                borderColor: this.props.stageborderColor,
                borderWidth: 1,
              },
            ],
          }}
          height={'250%'}
          options={{            
            layout: {
              padding: {
                right: 140,
                left: 120,
                top: 50,
                bottom: 50
              }
            },
            scales: {
              yAxes: [{
                ticks: {
                  display: false,
                  beginAtZero: true,                  
                },
              }],
              xAxes: [{
                ticks: {
                  beginAtZero: true,
                },
                gridLines: {
                  
                }
              }],
            },
            tooltips: {
              xAlign:  'left',
              yAlign: 'center'
            }, 
            title: {
              display: true,
              text: this.props.title,
              fontSize: 20
            },
            legend: {
              display: false
            }
                        
          }}
          plugins={plugins}
        />
      </div>
    );
  }
}
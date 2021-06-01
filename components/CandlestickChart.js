import Chart from "react-apexcharts";
import React from 'react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

const CandlestickChart = (props) => {
    const [chartType, setChartType] = useState("1m");
    const [series, setSeries] = useState([]);

    useEffect(async () => {
      setChartType('1m');
      setSeries(await callCandleAPI(props.market, '1m'));
    }, [props.market]);

    const options = {
        chart: {
            type: 'candlestick',
        },
        plotOptions: {
            candlestick: {
                colors: {
                    upward: '#f54748',
                    downward: '#185adb'
                }
            }
        },
        title: {
            text: props.market,
            align: 'left'
        },
        xaxis: {
            type: 'datetime'
        },
        yaxis: {
            tooltip: {
                enabled: true
            }
        }
    }

    const handleChange = async (event) => {
      setChartType(event.target.value);
      setSeries(await callCandleAPI(props.market, event.target.value));
    }
      
    return (
        <div className="mixed-chart">
          <RadioGroup value={chartType} onChange={handleChange} row>
            <FormControlLabel value="1m" control={<Radio />} label="1분봉" />
            <FormControlLabel value="15m" control={<Radio />} label="15분봉" />
            <FormControlLabel value="60m" control={<Radio />} label="60분봉" />
          </RadioGroup>
          <Chart
              options = {options}
              series  = {series}
              type    = "candlestick"
              width   = {1000}
              height  = {500}
          />
        </div>
    );
}

/**
 * 캔들정보호출
 * @param {*} type 
 * @returns 
 */
 const callCandleAPI = async (market, chartType) => {
  let resultData = [];
  await axios({url:process.env.NEXT_PUBLIC_API_URL + '/api/coin/candle?market=' + market + '&chartType=' + chartType}).then(response => {
      resultData = response.data;
  });

  return resultData;
}

export default CandlestickChart;

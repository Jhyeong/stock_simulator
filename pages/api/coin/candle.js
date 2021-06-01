import axios from 'axios';

export default async (req, res) => {
    res.status(200).json(await callGET(req.query.market, req.query.chartType));
}

const callGET = async (market, chartType) => {
    let resultList = [{data : ''}];
    let tmpList = [];
    let type = 'minutes'
    if(chartType.substr(chartType.length - 1) == 'd'){
        type = 'days';
    }

    const url = 'https://api.upbit.com/v1/candles/' + type + '/' + chartType.substr(0, chartType.length - 1) + '?market=' + market + '&count=200';

    await axios({url:url, method: "GET", headers: {Accept : 'application/json'}}).then(response => {
        // console.log("🚀 ~ file: candle.js ~ line 19 ~ response.data.map ~ response.data", response.data)
        response.data.map((data) => {
            const tmp = {
                x : new Date(new Date(data.candle_date_time_kst).getTime() + 9 * 60 * 60 * 1000),
                y : [data.opening_price, data.high_price, data.low_price, data.trade_price]
            }
            
            tmpList.push(tmp);
        });
    }).catch(error => {
        console.log(error.response.data);
    });

    resultList[0].data = tmpList;
    
    return resultList;
}
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Card, CardContent, Input, InputLabel, InputAdornment, InputBase, IconButton } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { DataGrid } from '@material-ui/data-grid';
import axios from 'axios';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import { red } from '@material-ui/core/colors';

const useStyles = makeStyles({
    root: {
      minWidth: 275,
    },
    stockList:{
        width: 1200,
        height: 500,
        float: 'left',
        marginRight: 20,
        paddingLeft: 5,
    },
    inputSearch: {
        width: 400,
    },
    frnTable:{
        width:550,
        height:400,
        float:'left',
        marginRight:25,
        "& .up": {
            color: 'red'
        },
        "& .down": {
            color: 'blue'
        }
    },
    orgTable:{
        width:550,
        height:400,
        "& .up": {
            color: 'red'
        },
        "& .down": {
            color: 'blue'
        }
    },
    chart: {
        width: 750,
    },
    iconButton: {
        padding: 10,
    },
});

const FrnOrgTrade = (props) => { 
    const classes = useStyles();
    
    const [value, setValue] = React.useState('buy');
    const [frnDataList, setFrnDataList] = React.useState(props.frnDataList);
    const [orgDataList, setOrgDataList] = React.useState(props.orgDataList);

    // 열 정의
    const columns = [
        { field: 'id'       , headerName: '종목코드', width: 120 },
        { field: 'stockName', headerName: '종목명'  , width: 130 },
        { field: 'quantity' , headerName: '수량'    , width: 130, cellClassName: value == "buy" ? "up" : "down" },
        { field: 'amount'   , headerName: '금액'    , width: 130, cellClassName: value == "buy" ? "up" : "down" },
    ];

    //순매수 / 순매도 변경 이벤트
    const changeTradeType = async (event) => {
      setValue(event.target.value);
      setFrnDataList(Array.from(await callStockData(event.target.value))[0]);
      setOrgDataList(Array.from(await callStockData(event.target.value))[1]);
    };

    return(
        <div className={classes.root}>
            {/* 주식종목 리스트 */}
            <Card className={classes.stockList}>
                <CardContent>
                    {/* 매매타입 라디오버튼 */}
                    <div>
                        <FormControl component="fieldset">
                        <FormLabel component="legend">외국인/기관 매매</FormLabel>
                        <RadioGroup value={value} onChange={changeTradeType} row>
                            <FormControlLabel value="buy" control={<Radio />} label="순매수" />
                            <FormControlLabel value="sell" control={<Radio />} label="순매도" />
                        </RadioGroup>
                        </FormControl>
                    </div>
                    {/* 데이터 테이블 */}
                    <div>
                        <DataGrid className={classes.frnTable} rows={frnDataList} columns={columns} pageSize={5}/>
                        <DataGrid className={classes.orgTable} rows={orgDataList} columns={columns} pageSize={5}/>
                    </div>
                </CardContent>
            </Card>
            {/* 주식차트 */}
            <Card className={classes.chart}>
                <CardContent>
                    <img
                        src="https://ssl.pstatic.net/imgfinance/chart/item/candle/day/005930.png"
                        alt="Picture of the author"
                    />
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * 네이버에서 주식정보를 크롤링하는 api 호출
 * @param {*} type 
 * @returns 
 */
const callStockData = async (type) => {
    let stockDataList;
    await axios({url:"http://localhost:3000/api/stockList?type=" + type}).then(response => {
        stockDataList = response.data;
    });

    return stockDataList;
}

/**
 * SSR
 * @returns 
 */
export async function getServerSideProps(){
    const stockDataList = await callStockData("buy");

    return {
        props: {
            frnDataList : stockDataList[0],
            orgDataList : stockDataList[1],
        }
    }
}

export default FrnOrgTrade;
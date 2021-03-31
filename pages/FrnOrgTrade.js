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
        width:450,
        height:400,
        float:'left',
        marginRight:25,
    },
    orgTable:{
        width:450,
        height:400,
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
    // 열 정의
    const columns = [
        { field: 'id', headerName: '종목코드', width: 120 },
        { field: 'stockName', headerName: '종목명', width: 130 }
    ];

    const [value, setValue] = React.useState('buy');

    const changeTradeType = (event) => {
      setValue(event.target.value);
    };

    return(
        <div className={classes.root}>
            {/* 주식종목 리스트 */}
            <Card className={classes.stockList}>
                {/* 주식종목 검색창 */}
                {/* <CardContent>
                    <Input
                        className={classes.inputSearch}
                        placeholder="주식종목"
                    />
                    <IconButton type="submit" className={classes.iconButton}>
                        <SearchIcon />
                    </IconButton>
                </CardContent> */}
                {/* 주식종목 테이블 */}
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
                        <DataGrid className={classes.frnTable} rows={props.frnDataList} columns={columns} pageSize={5}/>
                        <DataGrid className={classes.orgTable} rows={props.orgDataList} columns={columns} pageSize={5}/>
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
 * 네이버증권에서 주식정보를 크롤링하는 함수
 * @param {*} type : 검색타입(buy or sell)
 */
const callStockData = async (type) => {
    const url = "https://finance.naver.com/sise/sise_deal_rank_iframe.nhn?sosok=01&investor_gubun=9000&type=buy";
    let stockDataList = [];

    await axios({url, method:"GET",responseEncoding:"binary"}).then(response => {
        const $ = cheerio.load(response.data);
        $(".box_type_ms:eq(1) div").each((index, item) => {
            console.log(item);
            const data = {
                //id : iconv.decode($(item).attr("href").split("=")[1], "EUC-KR"),
                //stockName : iconv.decode($(item).text(), "EUC-KR")
            };

            stockDataList.push(data);
        });
    });

    return stockDataList;
}

/**
 * SSR
 * @returns 
 */
export async function getServerSideProps(){
    const stockDataList = Array.from(await callStockData("buy"));

    return {
        props: {
            frnDataList : stockDataList,
            orgDataList : stockDataList,
        }
    }
}

export default FrnOrgTrade;
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Card, CardContent, Input, InputLabel, InputAdornment, InputBase, IconButton } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { DataGrid } from '@material-ui/data-grid';
import axios from 'axios';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';

const useStyles = makeStyles({
    root: {
      minWidth: 275,
    },
    stockList:{
        width: 500,
        height: 500,
        float: 'left',
        marginRight: 20,
        paddingLeft: 5,
    },
    inputSearch: {
        width: 400,
    },
    stockTable:{
        width: 450,
        height: 400,
    },
    chart: {
        width: 750,
    },
    iconButton: {
        padding: 10,
    },
});

const Simulation = ({stockDataList}) => { 
    const classes = useStyles();
    // 열 정의
    const columns = [
        { field: 'id', headerName: '종목코드', width: 120 },
        { field: 'stockName', headerName: '종목명', width: 130 }
    ];

    return(
        <div className={classes.root}>
            {/* 주식종목 리스트 */}
            <Card className={classes.stockList}>
                {/* 주식종목 검색창 */}
                <CardContent>
                    <Input
                        className={classes.inputSearch}
                        placeholder="주식종목"
                    />
                    <IconButton type="submit" className={classes.iconButton}>
                        <SearchIcon />
                    </IconButton>
                </CardContent>
                {/* 주식종목 테이블 */}
                <CardContent>
                    <div className={classes.stockTable}>
                        <DataGrid rows={stockDataList} columns={columns} pageSize={5}/>
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

// 초기 주식 데이터 크롤링
export async function getServerSideProps(){
    const url = "https://finance.naver.com/sise/sise_market_sum.nhn?sosok=0&page=1";
    let stockDataList = [];

    await axios({url, method:"GET",responseEncoding:"binary"}).then(response => {
        const $ = cheerio.load(response.data);
        $(".type_2>tbody>tr>td>a:even").each((index, item) => {
            const data = {
                id : iconv.decode($(item).attr("href").split("=")[1], "EUC-KR"),
                stockName : iconv.decode($(item).text(), "EUC-KR")
            };

            stockDataList.push(data);
        });
    });


    return {
        props: {
            stockDataList : stockDataList,
        }
    }
}

export default Simulation;
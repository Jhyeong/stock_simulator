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
import classNames from 'classnames';
import FrnOrgHist from './api/FrnOrgHist';

const useStyles = makeStyles({
    root: {
      minWidth: 275,
    },
    stockListCard:{
        width: 700,
        height: 800,
        float: 'left',
        marginRight: 20,
        paddingLeft: 5,
    },
    inputSearch: {
        width: 400,
    },
    stockListTable:{
        width:650,
        height:680,
        float:'left',
        marginRight:25,
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
    currentPrice: {
        fontSize: 30,
        fontWeight: 'bold',
    },
    priceUp: {
        fontWeight: 'bold',
        color:'red'
    },
    priceDown: {
        fontWeight: 'bold',
        color:'blue'
    }
});

const FrnOrgTrade = (props) => { 
    const classes = useStyles();
    
    const [tradeType, setTradeType]                 = React.useState('buy');                //매매타입
    const [page, setPage]                           = React.useState(0);                    //테이블 페이지
    const [sortType, setSortType]                   = React.useState("desc");               //테이블 정렬
    const [stockDataList, setStockDataList]         = React.useState(props.stockDataList);  //테이블 데이터 리스트
    const [stockDetail, setStockDetail]             = React.useState(props.stockDetail);    //상세데이터
    const [frnOrgHist, setFrnOrgHist]               = React.useState(props.frnOrgHist);    //외국인/기관 매매 내역
    const [selectedStockCode, setSelectedStockCode] = React.useState(props.stockDetail.id); //선택한 주식종목코드

    // 열 정의
    const columns = [
        { field: 'id'       , headerName: '종목코드'    , width: 120 },
        { field: 'stockName', headerName: '종목명'      , width: 130 },
        { field: 'frnAmount', headerName: '외국인 금액' , width: 130, cellClassName: tradeType == "buy" ? "up" : "down", type:"number" },
        { field: 'orgAmount', headerName: '기관 금액'   , width: 130, cellClassName: tradeType == "buy" ? "up" : "down", type:"number" },
        { field: 'sum'      , headerName: '합계'        , width: 130, cellClassName: tradeType == "buy" ? "up" : "down", type:"number" }
    ];

    //순매수 / 순매도 변경 이벤트
    const changeTradeType = async (event) => {
        setStockDataList(Array.from(await callStockList(event.target.value)));
        setTradeType(event.target.value);
        event.target.value == "buy" ? setSortType("desc") : setSortType("asc");
        setPage(0);
    };

    //행 클릭 이벤트
    const onRowClick = async (param, e) => {
        setSelectedStockCode(param.id);
        setStockDetail(await callStockDetail(param.id));
        setFrnOrgHist(await callFrnOrgHist(param.id));
    }

    return(
        <div className={classes.root}>
            {/* 주식종목 리스트 */}
            <Card className={classes.stockListCard}>
                <CardContent>
                    {/* 매매타입 라디오버튼 */}
                    <div>
                        <FormControl component="fieldset">
                        <FormLabel component="legend">외국인/기관 매매</FormLabel>
                        <RadioGroup value={tradeType} onChange={changeTradeType} row>
                            <FormControlLabel value="buy" control={<Radio />} label="순매수" />
                            <FormControlLabel value="sell" control={<Radio />} label="순매도" />
                        </RadioGroup>
                        </FormControl>
                    </div>
                    {/* 데이터 테이블 */}
                    <div>
                        <DataGrid 
                            className={classes.stockListTable} 
                            rows={stockDataList} 
                            columns={columns}
                            onRowClick={onRowClick}
                            page={page}
                            pageSize={10}
                            sortModel={[
                                {
                                  field: 'sum',
                                  sort: sortType,
                                },
                              ]}
                        />
                    </div>
                </CardContent>
            </Card>
            {/* 주식 정보 */}
            <Card className={classes.chart}>
                {/* 상단요약 */}
                <CardContent>
                    <div>
                        <h1>{stockDetail.stockName}({stockDetail.id})</h1>
                        <span className={classNames(classes.currentPrice, parseInt(stockDetail.changedPrice) > 0 ? classes.priceUp : classes.priceDown)}>{stockDetail.currentPrice}</span> 전일대비 
                        <span className={parseInt(stockDetail.changedPrice) > 0 ? classes.priceUp : classes.priceDown}>{stockDetail.changedPrice} | {stockDetail.changedRatio}</span>
                    </div>
                </CardContent>
                {/* 차트 */}
                <CardContent>
                    <img
                        src={"https://ssl.pstatic.net/imgfinance/chart/item/candle/day/" + selectedStockCode + ".png"}
                        alt=""
                    />
                </CardContent>
                {/* 외국인/기관매매 상세 */}
                <CardContent>
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * 주식리스트 api 호출
 * @param {*} type 
 * @returns 
 */
const callStockList = async (type) => {
    let stockList;
    await axios({url:"http://localhost:3000/api/StockList?type=" + type}).then(response => {
        stockList = response.data;
    });

    return stockList;
}

/**
 * 주식상세정보 api 호출
 * @param {*} stockCode 
 * @returns 
 */
const callStockDetail = async (stockCode) => {
    let stockDetail;
    await axios({url:"http://localhost:3000/api/StockDetail?type=" + stockCode}).then(response => {
        stockDetail = response.data;
    });

    return stockDetail;
}

/**
 * 외국인/기관 매매 내역 api 호출
 * @param {*} stockCode 
 * @returns 
 */
 const callFrnOrgHist = async (stockCode) => {
    let frnOrgHist;
    await axios({url:"http://localhost:3000/api/FrnOrgHist?type=" + stockCode}).then(response => {
        frnOrgHist = response.data;
    });

    return frnOrgHist;
}

/**
 * SSR
 * @returns 
 */
export async function getServerSideProps(){
    const stockDataList = await callStockList("buy");                   //주식리스트
    const stockDetail   = await callStockDetail(stockDataList[0].id);   //주식상세정보
    const frnOrgHist    = await callFrnOrgHist(stockDataList[0].id);    //외국인/기관 매매 내역
    
    return {
        props: {
            stockDataList : stockDataList,
            stockDetail   : stockDetail,
            frnOrgHist    : frnOrgHist
        }
    }
}

export default FrnOrgTrade;
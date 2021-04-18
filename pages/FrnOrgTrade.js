import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Card, CardContent} from '@material-ui/core';
import { DataGrid } from '@material-ui/data-grid';
import axios from 'axios';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import classNames from 'classnames';

const useStyles = makeStyles({
    root: {
      minWidth: 275,
    },
    cardArea: {
        width: 750,
        height: 500,
        float: 'left',
        marginRight: 20,
        marginBottom: 10,
        padding: 5,
    },
    stockListTable:{
        width:700,
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
    },
    frnOrgHistTable:{
        fontSize: 12,
        width:700,
        height:450,
        "& .up": {
            color: 'red'
        },
        "& .down": {
            color: 'blue'
        }
    },
    stockNewsTable:{
        fontSize: 12,
        width:700,
        height:450,
    }
});

const FrnOrgTrade = (props) => { 
    const classes = useStyles();
    
    const [tradeType            , setTradeType]         = React.useState('buy');                //매매타입
    const [page                 , setPage]              = React.useState(0);                    //테이블 페이지
    const [sortType             , setSortType]          = React.useState("desc");               //테이블 정렬
    const [stockDataList        , setStockDataList]     = React.useState(props.stockDataList);  //테이블 데이터 리스트
    const [stockDetail          , setStockDetail]       = React.useState(props.stockDetail);    //상세데이터
    const [frnOrgHist           , setFrnOrgHist]        = React.useState(props.frnOrgHist);     //외국인/기관 매매 내역
    const [stockNews            , setStockNews]         = React.useState(props.stockNews);      //종목 뉴스
    const [selectedStockCode    , setSelectedStockCode] = React.useState(props.stockDetail.id); //선택한 주식종목코드

    // 열 정의
    const stockListColumns = [
        { field: 'id'       , headerName: '종목코드'    , flex: 1 },
        { field: 'stockName', headerName: '종목명'      , flex: 1 },
        { field: 'frnAmount', headerName: '외국인 금액' , flex: 1, cellClassName: tradeType == "buy" ? "up" : "down", type:"number" },
        { field: 'orgAmount', headerName: '기관 금액'   , flex: 1, cellClassName: tradeType == "buy" ? "up" : "down", type:"number" },
        { field: 'sum'      , headerName: '합계'        , flex: 1, cellClassName: tradeType == "buy" ? "up" : "down", type:"number" }
    ];

    const frnOrgHistColumns = [
        { field: 'id'           , headerName: '날짜'    , flex: 1},
        { field: 'finalPrice'   , headerName: '종가'    , flex: 1},
        { field: 'changedPrice' , headerName: '전일비'  , flex: 1 , cellClassName: (params) => (parseInt(params.value) > 0 ? "up" : "down")},
        { field: 'frnQuantity'  , headerName: '외국인'  , flex: 1 , cellClassName: (params) => (parseInt(params.value) > 0 ? "up" : "down")},
        { field: 'orgQuantity'  , headerName: '기관'    , flex: 1 , cellClassName: (params) => (parseInt(params.value) > 0 ? "up" : "down")}
    ];

    const stockNewsColumns = [
        { field: 'title'    , headerName: '제목'    , flex: 1},
        { field: 'dateTime' , headerName: '날짜'    , flex: 1, type:"date"},
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
        setStockNews(await callStockNews(param.id));
    }

    return(
        <div className={classes.root}>
            {/* 주식종목 리스트 */}
            <Card className={classes.cardArea}>
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
                            columns={stockListColumns}
                            onRowClick={onRowClick}
                            page={page}
                            pageSize={5}
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
            {/* 외국인/기관 매매 상세 내역*/}
            <Card className={classes.cardArea}>
                <CardContent>
                    <div>
                        <FormLabel component="legend">외국인/기관매매 상세 내역</FormLabel>
                        <DataGrid 
                            className={classes.frnOrgHistTable} 
                            rows={frnOrgHist} 
                            columns={frnOrgHistColumns}
                            page={0}
                            pageSize={5}
                        />
                    </div>
                </CardContent>
            </Card>
            {/* 주식 상세 정보 */}
            <Card className={classes.cardArea}>
                {/* 상단요약 */}
                <CardContent>
                    <div>
                        <FormLabel component="legend">주식상세정보</FormLabel>
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
            </Card>
            {/* 종목 뉴스*/}
            <Card className={classes.cardArea}>
                <CardContent>
                    <div>
                        <FormLabel component="legend">종목뉴스</FormLabel>
                        <DataGrid 
                            className={classes.stockNewsTable} 
                            rows={stockNews} 
                            columns={stockNewsColumns}
                            page={0}
                            pageSize={5}
                        />
                    </div>
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
    await axios({url:process.env.NEXT_PUBLIC_API_URL + "/api/StockList?type=" + type}).then(response => {
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
    await axios({url:process.env.NEXT_PUBLIC_API_URL + "/api/StockDetail?type=" + stockCode}).then(response => {
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
    await axios({url:process.env.NEXT_PUBLIC_API_URL + "/api/FrnOrgHist?type=" + stockCode}).then(response => {
        frnOrgHist = response.data;
    });

    return frnOrgHist;
}

/**
 * 종목 뉴스 api 호출
 * @param {*} stockCode 
 * @returns 
 */
 const callStockNews = async (stockCode) => {
    let stockNews;
    await axios({url:process.env.NEXT_PUBLIC_API_URL + "/api/StockNews?type=" + stockCode}).then(response => {
        stockNews = response.data;
    });

    return stockNews;
}

/**
 * SSR
 * @returns 
 */
export async function getServerSideProps(){
    const stockDataList = await callStockList("buy");                   //주식리스트
    const stockDetail   = await callStockDetail(stockDataList[0].id);   //주식상세정보
    const frnOrgHist    = await callFrnOrgHist(stockDataList[0].id);    //외국인/기관 매매 내역
    const stockNews     = await callStockNews(stockDataList[0].id);     //종목뉴스
    //const stockNews = []
    //console.log(stockNews);

    return {
        props: {
            stockDataList : stockDataList,
            stockDetail   : stockDetail,
            frnOrgHist    : frnOrgHist,
            stockNews     : stockNews,
        }
    }
}

export default FrnOrgTrade;
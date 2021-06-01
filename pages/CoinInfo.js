import axios from 'axios';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Timer from '../components/Timer';
import querystring from 'querystring';
import Switch from '@material-ui/core/Switch';
import Button from '@material-ui/core/Button';
import DateFnsUtils from '@date-io/date-fns';
import {MuiPickersUtilsProvider,KeyboardDatePicker} from '@material-ui/pickers';
const CandlestickChart = dynamic(() => import('../components/CandlestickChart'),{ ssr: false });

const useStyles = makeStyles({
    contentMarket:{
        float: 'left',
        marginRight: 50,
    },
    contentChart: {
        float: 'left',
        width: 1200
    },
    contentTrade:{
        // float: 'left'
    },
    paper: {
        width: 600,
    },
    tableHead : {
        backgroundColor: '#ffef62'
    },
    th: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    korean_name: {
        fontSize: 15,
        fontWeight: 'bold'
    },
    rise: {
        color: 'red',
        fontWeight: 'bold'
    },
    fall: {
        color: 'blue'
    },
    even: {
        color: 'gray'
    },
    tr:{
        borderColor: 'red',
    }
});

/**
 * 코인정보
 * @param {*} props 
 */

const CoinInfo = (props) => {
    const classes = useStyles();
    let websocket;
    const [marketList, setMarketList] = useState(props.marketList); //마켓 목록
    const [tradeList, setTradeList] = useState([]);// 매수대기목록
    const [profitList, setProfitList] = useState([]); // 정산목록
    const [accountList, setAccountList]   = useState(props.accountList); //계좌목록
    const [tradeSwitch, setTradeSwitch] = useState(false);
    const {min, sec} = useSelector(state => ({min : state.timer.min, sec : state.timer.sec}));
    const [selectedDate, setSelectedDate] = useState(new Date());//정산 조회 날짜
    const [selectedMarket, setSelectedMarket] = useState('KRW-ETC');//선택한 마켓
    const buyBase = 3;  //매수기준%
    const lossBase = -3; //손절%
    const profitBase = 3;//익절%

    const handleDateChange = (date) => {
      setSelectedDate(date);
    };

    //최초 로딩시 실시간 시세정보 호출
    useEffect(() => {
        getRealTimeCoinInfo();
    }, []);

    //5분 단위로 종가 저장, 수익률 계산 및 텔레그램 전송
    useEffect(() => {
        if(min == 0 && sec == 0){
            //5분전 대비 필드 초기화
            marketList.map((marketData) => {
                marketData.beforePrice = marketData.trade_price;
                marketData.beforeChangedPrice = 0;
                marketData.beforeChangedRate = "0.00%";
            });

            // 주문정보 초기화
            setTradeList([]);
        }else{
            marketList.map((marketData) => {
                //떡상코인 매수 & 텔레그램 전송
                if(marketData.beforeChangedRate && parseInt(marketData.beforeChangedRate) >= buyBase){
                    const trade = tradeList.find((trade) => trade.market == marketData.market);
                    const account = accountList.find((account) => account.unit_currency + '-' + account.currency == marketData.market);
                    
                    //매수대기목록 & 보유계좌에 없는 경우 매수
                    if(!trade && !account){
                        const data = {
                            market      : marketData.market,
                            korean_name : marketData.korean_name,
                            tradeType   : "매수",
                            tradePrice  : 7000,
                            tradeTime   : new Date().toLocaleTimeString()
                        }
                        tradeList.push(data);

                        //매수주문
                        if(tradeSwitch){
                            callOrderAPI('POST', 'bid', marketData.market, 7000, null);
                        }
                    }
                    // callTelegramAPI("떡상코인 : " + marketData.korean_name + "[" + marketData.beforeChangedRate + "]");
                }
                
                marketData.beforeChangedPrice = marketData.beforePrice == null ? 0 : toNumber(marketData.trade_price) - toNumber(marketData.beforePrice);//5분전대비 금액
                marketData.beforeChangedRate   = (marketData.beforeChangedPrice / toNumber(marketData.beforePrice) * 100).toFixed(2) + "%";//5분전대비 변경률
                marketData.beforeChangedPrice = marketData.beforeChangedPrice.toLocaleString("ko-KR");
                
                //보유코인 평가손익
                if(marketData.avgPrice > 0){
                    // console.log("🚀 ~ file: CoinInfo.js ~ line 115 ~ marketList.map ~ marketData.market", marketData.market)
                    marketData.profitRate       = (((toNumber(marketData.trade_price) / marketData.avgPrice) * 100) - 100).toFixed(2); //수익률
                    marketData.profitPrice      = toCurrency(((toNumber(marketData.trade_price) - marketData.avgPrice)) * marketData.ownVolume)//수익금액
                }else{
                    marketData.profitRate = 0;
                    marketData.profitPrice = 0;
                }
            });

            setTradeList(tradeList.slice());
        }
        setMarketList(marketList.slice());

        if(sec % 10 == 0){
            //10초 단위로 보유계좌 갱신
            callAccountAPI().then((result) => {
                setAccountList(result);
            });
        }
        
    }, [min, sec]);

    /**
     * 보유계좌 갱신
     */
    useEffect(() => {
        // 마켓정보와 맵핑
        marketList.map((market) => {
            const account = accountList.find(account => account.unit_currency + '-' + account.currency == market.market);

            //보유계좌 평가손익 갱신
            if(account){
                market.avgPrice         = toNumber(account.avg_buy_price).toFixed(0);                  //평단
                market.ownPrice         = toNumber(account.avg_buy_price * account.balance).toFixed(0) //매수금액
                market.ownVolume        = account.balance;                                             //매수량

                if(tradeSwitch && (market.profitRate <= lossBase || profitBase <= market.profitRate) && toNumber(market.ownPrice) + toNumber(market.profitPrice) >= 5000){
                    const type = market.profitRate <= lossBase ? "손절" : '익절';
                    callOrderAPI('POST', 'ask', account.unit_currency + '-' + account.currency, null, account.balance);

                    //5분전 대비 초기화
                    market.beforePrice = market.trade_price;
                    market.beforeChangedPrice = 0;
                    market.beforeChangedRate = "0.00%";
                }
            }else{
                market.avgPrice         = 0;
                market.ownPrice         = 0; 
                market.ownVolume        = 0;
            }
        });

    }, [accountList]);

    //실시간 코인 정보 호출
    const getRealTimeCoinInfo = () =>{
        websocket = new WebSocket("wss://api.upbit.com/websocket/v1");
        websocket.binaryType = 'arraybuffer';
        websocket.onopen    = onOpenWebsocket;
        websocket.onclose   = onCloseWebsocket;
        websocket.onmessage = onMessageWebsocket;
        websocket.onerror   = onErrorWebsocket;
    }

    //웹소켓 open
    const onOpenWebsocket = () =>{
        console.log("업비트 opened");
        let marketLists = [];
        //검색할 마켓 셋팅
        marketList.map((market) => {
            marketLists.push(market.market);
        });
        websocket.send(JSON.stringify([{"ticket":guid()},{"type":"ticker","codes": marketLists}]));//isOnlySnapshot
    }
    
    const onCloseWebsocket = () =>{
        console.log("업비트 closed");
    }

    const onMessageWebsocket = (result) =>{
        const enc = new TextDecoder("utf-8");
        let coinData = JSON.parse(enc.decode(new Uint8Array(result.data)));
        marketList.map((market) => {
            if(market.market == coinData.code){
                market.trade_price          = coinData.trade_price.toLocaleString("ko-KR");
                market.signed_change_rate   = (coinData.signed_change_rate * 100).toFixed(2) + "%";
                market.acc_trade_price_24h  = (coinData.acc_trade_price_24h.toFixed(0) * 0.00000001).toLocaleString("ko-KR") + "백만";
                market.change               = coinData.change;
                if(market.beforePrice == null){
                    market.beforePrice          = coinData.trade_price.toLocaleString("ko-KR");
                }
            }
        });
    }

    const onErrorWebsocket = () =>{
        alert("업비트 시세 수신에 실패하였습니다.");
    }

    //uuid 생성
    const guid = () => {
        const s4 = () => {
          return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    //문자형 금액을 int형으로 변경
    const toNumber = (val) => {
        if(typeof val == "string"){
            val = parseInt(val.replace(/,/g, ""), 10);
        }
        return val;
    }

    //숫자를 금액포맷으로 변경
    const toCurrency = (val) => {
        if(typeof val == "number"){
            val = parseInt(val.toFixed(0), 10).toLocaleString("ko-KR");
        }

        return val;
    }

    /**
     * 정산 새로고침
     */
    const getProfitList = async () => {
        setProfitList([]);
        setProfitList(await callProfitAPI(selectedDate));
    }

    /**
     * 자동매매 여부 스위치
     */
    const changeTradeSwitch = () => {
        setTradeSwitch(!tradeSwitch);
    }

    /**
     * 마켓 행 클릭
     * @param {*} event 
     * @param {*} market 
     */
    const clickMarketRow = (event, market) => {
        setSelectedMarket(market);
    }

    return(
        <div>
            <button onClick={callAccountAPI}>계좌조회</button>
            <button onClick={callOrderAPI.bind(this, 'POST', 'bid', 'KRW-ETC', '5000', null)}>매수하기</button>
            <button onClick={callOrderAPI.bind(this, 'POST', 'ask', 'KRW-ETC', null, '0.00010912')}>매도하기</button>
            <div>
                <span>자동매매</span>
                <Switch
                    checked={tradeSwitch}
                    onChange={changeTradeSwitch}
                    inputProps={{ 'aria-label': 'secondary checkbox' }}
                />
            </div>
            <div>
                <Timer></Timer>
            </div>
            <div className={classes.contentMarket}>
                <h2>마켓정보</h2>
                <TableContainer className={classes.paper} component={Paper}>
                    <Table className={classes.table} aria-label="simple table">
                        <TableHead className={classes.tableHead}>
                            <TableRow>
                                <TableCell className={classes.th} align="center">마켓명</TableCell>
                                <TableCell className={classes.th} align="center">등락</TableCell>
                                <TableCell className={classes.th} align="center">현재가</TableCell>
                                <TableCell className={classes.th} align="center">5분전 대비</TableCell>
                                <TableCell className={classes.th} align="center">평가손익</TableCell>
                                <TableCell className={classes.th} align="center">거래대금</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {marketList.map((market) => (
                                <TableRow key={market.market} hover={true} className={classes.tr} onClick={(event) => clickMarketRow(event, market.market)}>
                                    {/* 마켓명 */}
                                    <TableCell align="center" padding="none">
                                        <p className={classes.korean_name}>{market.korean_name}</p>
                                        <p>{market.market}</p>
                                    </TableCell>
                                    {/* 등락 */}
                                    <TableCell 
                                        className={market.change == "RISE" ? classes.rise : market.change == "FALL" ? classes.fall : classes.even}
                                        align="center"
                                        padding="none"
                                    >
                                        <p>{market.change == "RISE" ? "상승" : market.change == "FALL" ? "하락" : "보합"}</p>
                                    </TableCell>
                                    {/* 현재가 */}
                                    <TableCell 
                                        className={market.change == "RISE" ? classes.rise : market.change == "FALL" ? classes.fall : classes.even}
                                        align="center"
                                        padding="none"
                                    >
                                        <p>{market.trade_price}</p>
                                        <p>{market.signed_change_rate}</p>    
                                    </TableCell>
                                    {/* 5분전 대비 */}
                                    <TableCell
                                        className={toNumber(market.beforeChangedPrice) > 0 ? classes.rise : toNumber(market.beforeChangedPrice) < 0 ? classes.fall : classes.even}
                                        align="center"
                                        padding="none"
                                    >
                                        <p>{market.beforeChangedPrice}</p>
                                        <p>{market.beforeChangedRate}</p>
                                    </TableCell>
                                    {/* 보유코인 평가손익 */}
                                    <TableCell
                                        className={market.profitRate > 0 ? classes.rise : market.profitRate < 0 ? classes.fall : classes.even}
                                        align="center"
                                        padding="none"
                                    >
                                        <p>{market.profitPrice}</p>
                                        <p>{market.profitRate}%</p>
                                    </TableCell>
                                    {/* 거래대금 */}
                                    <TableCell
                                        align="center"
                                        padding="none"
                                    >
                                        <p>{market.acc_trade_price_24h}</p>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
            <div className={classes.contentChart}>
                <h2>차트</h2>
                <CandlestickChart market={selectedMarket}></CandlestickChart>
            </div>
            <div className={classes.contentTrade}>
                <h2>매수대기목록</h2>
                <TableContainer className={classes.paper} component={Paper}>
                    <Table className={classes.table} aria-label="simple table">
                        <TableHead className={classes.tableHead}>
                            <TableRow>
                                <TableCell className={classes.th} align="center">마켓명</TableCell>
                                <TableCell className={classes.th} align="center">주문타입</TableCell>
                                <TableCell className={classes.th} align="center">주문금액</TableCell>
                                <TableCell className={classes.th} align="center">주문시간</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tradeList.map((tradeData) => (
                                <TableRow key={tradeData.market}>
                                    <TableCell
                                        align="center"
                                        padding="none"
                                    >
                                        <p className={classes.korean_name}>{tradeData.korean_name}</p>
                                        <p>{tradeData.market}</p>
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        padding="none"
                                        className={tradeData.tradeType == "매수" ? classes.rise : classes.fall}
                                    >
                                        <p>{tradeData.tradeType}</p>
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        padding="none"
                                    >
                                        <p>{tradeData.tradePrice}</p>
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        padding="none"
                                    >
                                        <p>{tradeData.tradeTime}</p>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
            <div className={classes.contentProfit}>
                <h2>정산
                <Button variant="outlined" color="primary" size="small" onClick={getProfitList}>
                    새로고침
                </Button>
                </h2>
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <KeyboardDatePicker
                        disableToolbar
                        variant="inline"
                        format="yyyy-MM-dd"
                        margin="normal"
                        id="date-picker-inline"
                        value={selectedDate}
                        onChange={handleDateChange}
                    />
                </MuiPickersUtilsProvider>
                <TableContainer className={classes.paper} component={Paper}>
                    <Table className={classes.table} aria-label="simple table">
                        <TableHead className={classes.tableHead}>
                            <TableRow>
                                <TableCell className={classes.th} align="center">마켓명</TableCell>
                                <TableCell className={classes.th} align="center">주문일자</TableCell>
                                <TableCell className={classes.th} align="center">매수</TableCell>
                                <TableCell className={classes.th} align="center">매도</TableCell>
                                <TableCell className={classes.th} align="center">합계</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {profitList.map((profitData) => (
                                <TableRow key={profitData.market}>
                                    <TableCell
                                        align="center"
                                        padding="none"
                                    >
                                        <p>{profitData.market}</p>
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        padding="none"
                                    >
                                        <p>{profitData.tradeDate}</p>
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        padding="none"
                                    >
                                        <p>{toCurrency(profitData.buyPrice)}</p>
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        padding="none"
                                    >
                                        <p>{toCurrency(profitData.sellPrice)}</p>
                                    </TableCell>
                                    <TableCell
                                        align="center"
                                        padding="none"
                                        className={toCurrency(profitData.sum) > 0 ? classes.rise : classes.fall}
                                    >
                                        <p>{toCurrency(profitData.sum)}</p>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
}

/**
 * 텔레그램 api 호출
 * @param {*} type 
 * @returns 
 */
 const callTelegramAPI = async (msg) => {
    let resultData = [];
    await axios({url:process.env.NEXT_PUBLIC_API_URL + "/api/TelegramAPI?msg=" + msg}).then(response => {
        resultData = response.data;
    });

    return resultData;
}

/**
 * 거래대금 상위 20 코인 목록 호출
 * @param {*} type 
 * @returns 
 */
const callMarketAPI = async () => {
    let resultData = [];

    await axios({url:process.env.NEXT_PUBLIC_API_URL + '/api/coin/market'}).then(response => {
        resultData = response.data;
    });

    return resultData;
}

/**
 * 계좌정보조회
 * @param {*} type 
 * @returns 
 */
 const callAccountAPI = async () => {
    let resultData = [];
    await axios({url:process.env.NEXT_PUBLIC_API_URL + '/api/coin/account'}).then(response => {
        resultData = response.data;
    });

    return resultData;
}

/**
 * 주문하기
 * @param {*} method 
 * @param {*} tradeType 
 * @param {*} market 
 * @param {*} price 
 * @param {*} volume 
 * @returns 
 */
const callOrderAPI = async (method, tradeType, market, price, volume) => {
    let resultData;
    const param = {
        method : method,
        tradeType : tradeType,
        market : market,
        price : price,
        volume : volume
    };

    const query = querystring.encode(param);
    // console.log("🚀 ~ file: CoinInfo.js ~ line 442 ~ callOrderAPI ~ query", query)

    await axios({url:process.env.NEXT_PUBLIC_API_URL + '/api/coin/order?' + query}).then(response => {
        resultData = response.data;
    });

    return resultData;
}

/**
 * 정산결과
 * @param {*} type 
 * @returns 
 */
 const callProfitAPI = async (date) => {
    let resultData = [];
    await axios({url:process.env.NEXT_PUBLIC_API_URL + '/api/coin/profit?date=' + date}).then(response => {
        resultData = response.data;
    });

    return resultData;
}

/**
 * SSR
 * @returns 
 */
 export async function getServerSideProps(){
    const marketList = await callMarketAPI();
    const accountList  = await callAccountAPI();

    return {
        props: {
            marketList : marketList,
            accountList  : accountList,
        }
    }
}

export default CoinInfo;
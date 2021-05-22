import axios from 'axios';
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
import market from './api/coin/market';
import querystring from 'querystring';

const useStyles = makeStyles({
    contentMarket:{
        float: 'left',
        marginRight: 50,
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
    const [marketList, setMarketList] = useState(props.marketList);
    const [tradeList, setTradeList] = useState([]);
    const [account, setAccount]   = useState(props.account);
    const {min, sec} = useSelector(state => ({min : state.timer.min, sec : state.timer.sec}));

    useEffect(() => {
        mappingAccount();
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
        }else if(sec == 10){
            //10초 단위로 주문내역을 갱신한다
            // const apiResult = callTradeAPI('GET');
        }else{
            marketList.map((marketData) => {
                //떡상코인 매수 & 텔레그램 전송
                if(marketData.beforeChangedRate && parseInt(marketData.beforeChangedRate) >= 3){
                    const tradeData = tradeList.find((tradeData) => tradeData.market == marketData.market);
                    if(tradeData == null){
                        const data = {
                            market      : marketData.market,
                            korean_name : marketData.korean_name,
                            tradeType   : "매수",
                            tradePrice  : 5000,
                            tradeTime   : new Date().toLocaleTimeString()
                        }
                        tradeList.push(data);
                    }
                    // callTelegramAPI("떡상코인 : " + marketData.korean_name + "[" + marketData.beforeChangedRate + "]");
                }
                
                marketData.beforeChangedPrice = marketData.beforePrice == null ? 0 : toNumber(marketData.trade_price) - toNumber(marketData.beforePrice);//5분전대비 금액
                marketData.beforeChangedRate   = (marketData.beforeChangedPrice / toNumber(marketData.beforePrice) * 100).toFixed(2) + "%";//5분전대비 변경률
                marketData.beforeChangedPrice = marketData.beforeChangedPrice.toLocaleString("ko-KR");
                
                //보유코인 평가손익
                if(marketData.avgPrice > 0){
                    marketData.profitRate       = (((toNumber(marketData.trade_price) / marketData.avgPrice) * 100) - 100).toFixed(2); //수익률
                    marketData.profitPrice      = toCurrency(((toNumber(marketData.trade_price) - marketData.avgPrice)) * marketData.ownVolume)//수익금액
                }
            });
            setTradeList(tradeList.slice());
        }
        
        setMarketList(marketList.slice());
    }, [min, sec]);

    /**
     * 마켓정보와 계좌정보 맵핑
     */
    const mappingAccount = () => {
        account.map((account) => {
            let market = marketList.find(market => market.market == account.unit_currency + '-' + account.currency);
            if(market){
                market.avgPrice         = toNumber(account.avg_buy_price).toFixed(0);                  //평단
                market.ownPrice         = toNumber(account.avg_buy_price * account.balance).toFixed(0) //매수금액
                market.ownVolume        = account.balance;                                             //매수량
            }
        });
    }

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

    return(
        <div>
            <button onClick={callAccountAPI}>계좌조회</button>
            <button onClick={callTradeAPI.bind(this, 'POST', 'bid', 'KRW-BTC', '5000', null)}>매수하기</button>
            <button onClick={callTradeAPI.bind(this, 'POST', 'ask', 'KRW-BTC', null, '0.00010912')}>매도하기</button>
            <button onClick={callTradeAPI.bind(this, 'GET')}>주문리스트</button>
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
                                <TableRow key={market.market} hover={true} className={classes.tr}>
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
            <div className={classes.contentTrade}>
                <h2>매수주문목록</h2>
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
                                <TableRow>
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
 * @param {*} tradeType   
 * @param {*} market 
 * @param {*} price 
 * @param {*} volume 
 * @returns 
 */
const callTradeAPI = async (method, tradeType, market, price, volume) => {
    let resultData;
    const param = {
        method : method,
        tradeType : tradeType,
        market : market,
        price : price,
        volume : volume
    };

    const query = querystring.encode(param);

    await axios({url:process.env.NEXT_PUBLIC_API_URL + '/api/coin/trade?' + query}).then(response => {
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
    const account  = await callAccountAPI();

    return {
        props: {
            marketList : marketList,
            account  : account,
        }
    }
}

export default CoinInfo;
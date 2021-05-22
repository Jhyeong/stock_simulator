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

const useStyles = makeStyles({
    paper: {
        width: 600,
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
        borderColor: 'red'
    }
});

/**
 * 코인정보
 * @param {*} props 
 */

const CoinInfo = (props) => {
    const classes = useStyles();
    let websocket;
    const [coinList, setCoinList] = useState(props.coinList);
    const {min, sec} = useSelector(state => ({min : state.timer.min, sec : state.timer.sec}));

    useEffect(() => {
        getRealTimeCoinInfo();
        
    }, []);

    //5분 단위로 종가 저장 및 텔레그램 전송
    useEffect(() => {
        if(min == 0 && sec == 0){
                coinList.map((item) => {
                    if(item.beforeChangedRate && parseInt(item.beforeChangedRate) >= 5){
                        callTelegramAPI("떡상코인 : " + item.korean_name + "[" + item.beforeChangedRate + "]");
                    }

                    item.beforePrice = item.trade_price;
                    item.beforeChangedPrice = 0;
                    item.beforeChangedRate = "0.00%";
                });
        }else{
            coinList.map((item) => {
                item.beforeChangedPrice = item.beforePrice == null ? 0 : toNumber(item.trade_price) - toNumber(item.beforePrice);
                item.beforeChangedRate   = (item.beforeChangedPrice / toNumber(item.beforePrice) * 100).toFixed(2) + "%";
                item.beforeChangedPrice = item.beforeChangedPrice.toLocaleString("ko-KR");
            });
        }
        setCoinList(coinList.slice());
    }, [min, sec]);

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
        let markets = [];
        //검색할 마켓 셋팅
        coinList.map((item) => {
            markets.push(item.market);
        });
        websocket.send(JSON.stringify([{"ticket":guid()},{"type":"ticker","codes": markets}]));//isOnlySnapshot
    }
    
    const onCloseWebsocket = () =>{
        console.log("업비트 closed");
    }

    const onMessageWebsocket = (result) =>{
        const enc = new TextDecoder("utf-8");
        let coinData = JSON.parse(enc.decode(new Uint8Array(result.data)));
        coinList.map((item) => {
            //item.market == coinData.code ? {...item, trade_price: 1} : item;
            if(item.market == coinData.code){
                item.trade_price          = coinData.trade_price.toLocaleString("ko-KR");
                item.signed_change_rate   = (coinData.signed_change_rate * 100).toFixed(2) + "%";
                item.acc_trade_price_24h  = (coinData.acc_trade_price_24h.toFixed(0) * 0.00000001).toLocaleString("ko-KR") + "백만";
                item.change               = coinData.change;
                if(item.beforePrice == null){
                    item.beforePrice          = coinData.trade_price.toLocaleString("ko-KR");
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

    //문자형 금액을 int형으로 리턴
    const toNumber = (val) => {
        if(val != null && val != ""){
            return parseInt(val.replace(/,/g, ""), 10);
        }
        return val;
    }

    return(
        <div>
            <button onClick={callTelegramAPI}>테스트</button>
            <div>
                <Timer></Timer>
            </div>
            <TableContainer className={classes.paper} component={Paper}>
                <Table className={classes.table} aria-label="simple table">
                    <TableHead >
                        <TableRow >
                            <TableCell className={classes.th} align="center">마켓명</TableCell>
                            <TableCell className={classes.th} align="center">등락</TableCell>
                            <TableCell className={classes.th} align="center">현재가</TableCell>
                            <TableCell className={classes.th} align="center">5분전 대비</TableCell>
                            <TableCell className={classes.th} align="center">거래대금</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {coinList.map((item) => (
                            <TableRow key={item.market} hover={true} className={classes.tr}>
                                {/* 마켓명 */}
                                <TableCell align="center" padding="none">
                                    <p className={classes.korean_name}>{item.korean_name}</p>
                                    <p>{item.market}</p>
                                </TableCell>
                                {/* 등락 */}
                                <TableCell 
                                    className={item.change == "RISE" ? classes.rise : item.change == "FALL" ? classes.fall : classes.even}
                                    align="center"
                                    padding="none"
                                >
                                    <p>{item.change == "RISE" ? "상승" : item.change == "FALL" ? "하락" : "보합"}</p>
                                </TableCell>
                                {/* 현재가 */}
                                <TableCell 
                                    className={item.change == "RISE" ? classes.rise : item.change == "FALL" ? classes.fall : classes.even}
                                    align="center"
                                    padding="none"
                                >
                                    <p>{item.trade_price}</p>
                                    <p>{item.signed_change_rate}</p>    
                                </TableCell>
                                {/* 5분전 대비 */}
                                <TableCell
                                    className={toNumber(item.beforeChangedPrice) > 0 ? classes.rise : toNumber(item.beforeChangedPrice) < 0 ? classes.fall : classes.even}
                                    align="center"
                                    padding="none"
                                >
                                    <p>{item.beforeChangedPrice}</p>
                                    <p>{item.beforeChangedRate}</p>
                                </TableCell>
                                {/* 거래대금 */}
                                <TableCell
                                    align="center"
                                    padding="none"
                                >
                                    <p>{item.acc_trade_price_24h}</p>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            
            
        </div>
    );
}

/**
 * 거래대금 상위 20 코인 목록 호출
 * @param {*} type 
 * @returns 
 */
 const callTelegramAPI = async (msg) => {
    let coinList;
    await axios({url:process.env.NEXT_PUBLIC_API_URL + "/api/TelegramAPI?msg=" + msg}).then(response => {
        coinList = response.data;
    });

    return coinList;
}

/**
 * 거래대금 상위 20 코인 목록 호출
 * @param {*} type 
 * @returns 
 */
const callCoinList = async (type) => {
    let coinList;
    await axios({url:process.env.NEXT_PUBLIC_API_URL + "/api/CoinInfo"}).then(response => {
        coinList = response.data;
    });

    return coinList;
}

/**
 * SSR
 * @returns 
 */
 export async function getServerSideProps(){
    const coinList = await callCoinList();

    return {
        props: {
            coinList : coinList
        }
    }
}

export default CoinInfo;
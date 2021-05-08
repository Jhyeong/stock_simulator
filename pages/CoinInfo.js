import axios from 'axios';
import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import io from 'socket.io-client';

const useStyles = makeStyles({
    paper: {
        width: 450,
    },
    table: {
      width: 450,
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
    }
});

/**
 * 코인정보
 * @param {*} props 
 */

const CoinInfo = (props) => {
    const classes = useStyles();
    const [coinList, setCoinList] = useState([]);

    //코인 목록 호출
    const callCoinList = async (type) => {
        await axios({url:process.env.NEXT_PUBLIC_API_URL + "/api/CoinInfo"}).then(response => {
            getRealTimeCoinInfo(response.data);
        });
    }

    const getRealTimeCoinInfo = (coinList) =>{
        let markets = [];
        const websocket = new WebSocket("wss://api.upbit.com/websocket/v1");
        websocket.binaryType = 'arraybuffer';
        
        websocket.onopen = () =>{
            console.log("업비트 opened");
            //검색할 마켓 셋팅
            coinList.map((item) => {
                markets.push(item.market);
            });
            websocket.send(JSON.stringify([{"ticket":guid()},{"type":"ticker","codes": markets}]));
        }

        websocket.onerror = () =>{
            alert("업비트 시세 수신에 실패하였습니다.");
        }

        websocket.onclose = () =>{
            console.log("업비트 closed");
        }

        websocket.onmessage = (result) =>{
            const enc = new TextDecoder("utf-8");
			const coinData = JSON.parse(enc.decode(new Uint8Array(result.data)));

            coinList.map((item) => {
                //item.market == coinData.code ? {...item, trade_price: 1} : item;
                if(item.market == coinData.code){
                    item.trade_price          = coinData.trade_price.toLocaleString("ko-KR");
                    item.signed_change_rate   = (coinData.signed_change_rate * 100).toFixed(2) + "%";
                    item.acc_trade_price_24h  = (coinData.acc_trade_price_24h.toFixed(0) * 0.00000001).toLocaleString("ko-KR") + "백만";
                }
            });

            setCoinList(coinList.slice());
        }
    }

    //uuid 생성
    const guid = () => {
        const s4 = () => {
          return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    return(
        <div>
            <button onClick={callCoinList}>코인목록 불러오기</button>
            <TableContainer className={classes.paper} component={Paper}>
                <Table className={classes.table} aria-label="simple table">
                    <TableHead >
                        <TableRow >
                            <TableCell className={classes.th} align="center">마켓명</TableCell>
                            <TableCell className={classes.th} align="center">등락</TableCell>
                            <TableCell className={classes.th} align="center">현재가</TableCell>
                            <TableCell className={classes.th} align="center">거래대금</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {coinList.map((item) => (
                            <TableRow key={item.market} hover={true}>
                                <TableCell align="center" padding="none">
                                    <p className={classes.korean_name}>{item.korean_name}</p>
                                    <p>{item.market}</p>
                                </TableCell>
                                <TableCell 
                                    className={item.change == "RISE" ? classes.rise : item.change == "FALL" ? classes.fall : classes.even}
                                    align="center"
                                    padding="none"
                                >
                                    <p>{item.change == "RISE" ? "상승" : item.change == "FALL" ? "하락" : "보합"}</p>
                                </TableCell>
                                <TableCell 
                                    className={item.change == "RISE" ? classes.rise : item.change == "FALL" ? classes.fall : classes.even}
                                    align="center"
                                    padding="none"
                                >
                                    <p>{item.trade_price}</p>
                                    <p>{item.signed_change_rate}</p>    
                                </TableCell>
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

export default CoinInfo;
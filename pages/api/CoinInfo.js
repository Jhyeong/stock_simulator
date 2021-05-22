import axios from 'axios';
import iconv from 'iconv-lite';
import io from 'socket.io-client';

export default async (req, res) => {
    res.status(200).json(await callCoinList(req.query.type))
}

/**
 * 코인리스트
 * 
 * @param {}} type 
 * @returns 
 */
const callCoinList = async () => {
    const coinListurl     = 'https://api.upbit.com/v1/market/all?isDetails=true';
    let coinDetailUrl     = 'https://api.upbit.com/v1/ticker?markets=';
    let coinAllList       = [];
    let coinDetailList    = [];
  
    //코인 전체 목록 호출
    await axios({url:coinListurl, method:"GET"}).then(response => {
      coinAllList = response.data;
  
      //상세정보를 호출할 마켓명을 url에 셋팅
      coinAllList.map((item) => {
          if(item.market.startsWith("KRW") && item.market_warning == "NONE"){
              coinDetailUrl += item.market + ","
          }
      });
  
      coinDetailUrl = coinDetailUrl.substr(0, coinDetailUrl.length - 1);
    }).catch(error => {
        console.log(error);
    });
  
  
    //코인 상세 정보 호출
    await axios({url:coinDetailUrl, method:"GET"}).then(response => {
      coinDetailList = response.data;
  
      //누적거래대금으로 내림차순 정렬
      coinDetailList.sort((a, b) => {
          if(a.acc_trade_price_24h == b.acc_trade_price_24h) return 0;
          if(a.acc_trade_price_24h < b.acc_trade_price_24h) return 1;
          if(a.acc_trade_price_24h > b.acc_trade_price_24h) return -1;
      });
  
      //상위 20개
      coinDetailList.splice(20, coinDetailList.length - 20);
  
      //마켓 한국명 맵핑 & 포맷 설정
      coinDetailList.map((detailItem) => {
          coinAllList.map((allItem) => {
              if(detailItem.market == allItem.market){
                  detailItem.korean_name          = allItem.korean_name;
                  detailItem.trade_price          = detailItem.trade_price.toLocaleString("ko-KR");
                  detailItem.signed_change_rate   = (detailItem.signed_change_rate * 100).toFixed(2) + "%";
                  detailItem.acc_trade_price_24h  = (detailItem.acc_trade_price_24h.toFixed(0) * 0.00000001).toLocaleString("ko-KR") + "백만";
                  detailItem.beforePrice          = detailItem.trade_price.toLocaleString("ko-KR");
              }
          });
      });
  
    }).catch(error => {
        console.log(error);
    });

    return coinDetailList;
}
import axios from 'axios';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';

export default async (req, res) => {
    res.status(200).json(await callStockData(req.query.type))
}

/**
 * 주식상세 정보 크롤링
 * 
 * @param {}} type 
 * @returns 
 */
const callStockData = async (stockCode) => {
  console.log("detail start")
  const url = "https://finance.naver.com/item/sise.nhn?code=" + stockCode;
  let stockData = {
      id: "",
      stockName: "",
      currentPrice: "",
      changedPrice: "",
      changedRatio: ""
    };
  
  // EUC-KR로 디코딩
  const decodeText = (text) =>{
      return iconv.decode(text.trim(), "EUC-KR");
  }

  //크롤링 실행
  await axios({url:url, method:"POST",responseEncoding:"binary"}).then(response => {
      const $ = cheerio.load(response.data);
    
      stockData.id = stockCode;
      stockData.stockName = decodeText($(".wrap_company a").text());
      stockData.currentPrice = decodeText($("#_nowVal").text());
      stockData.changedPrice = decodeText($("#_diff .tah").text());
      stockData.changedRatio = decodeText($("#_rate .tah").text());
      
      if(decodeText($("#_diff .blind").text()) == "하락"){
        stockData.changedPrice = "-" + stockData.changedPrice;
      }
  }).catch(error => {
      console.log(error);
  });

  console.log("detail end")
  return stockData;
}



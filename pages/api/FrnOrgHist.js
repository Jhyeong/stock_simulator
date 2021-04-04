import axios from 'axios';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';

export default async (req, res) => {
    res.status(200).json(await callStockData(req.query.type))
}

/**
 * 외국인/기관 매매 내역
 * 
 * @param {}} type 
 * @returns 
 */
const callStockData = async (stockCode) => {
  const url = "https://finance.naver.com/item/main.nhn?code=" + stockCode;
  let stockData = {
      date: "",
      finalPrice: "",
      changedPrice: "",
      frnQuantity: "",
      orgQuantity: ""
    };
  
  // EUC-KR로 디코딩
  const decodeText = (text) =>{
      return iconv.decode(text.trim(), "EUC-KR");
  }

  //크롤링 실행
  await axios({url:url, method:"POST",responseEncoding:"binary"}).then(response => {
      const $ = cheerio.load(response.data);
      console.log(decodeText(($(".sub_section.right").html())))
      stockData = decodeText(($(".sub_section.right").html()));
      // stockData.date = stockCode;
      // stockData.finalPrice = decodeText($(".wrap_company a").text());
      // stockData.changedPrice = decodeText($("#_nowVal").text());
      // stockData.frnQuantity = decodeText($("#_diff .tah").text());
      // stockData.orgQuantity = decodeText($("#_rate .tah").text());
      
      // if(decodeText($("#_diff .blind").text()) == "하락"){
      //   stockData.changedPrice = "-" + stockData.changedPrice;
      // }
  }).catch(error => {
      console.log(error);
  });

  return stockData;
}



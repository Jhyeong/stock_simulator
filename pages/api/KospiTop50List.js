import axios from 'axios';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';

export default async (req, res) => {
    res.status(200).json(await callStockData(req.query.type))
}

/**
 * KOSPI 시가총액 상위 50 리스트 크롤링
 * 
 * @returns 
 */
const callStockData = async () => {
  const kospiUrl = "https://finance.naver.com/sise/sise_market_sum.nhn?sosok=0&page=1";//시총 상위 50
  let stockDataList = [];
  // EUC-KR로 디코딩
  const decodeText = (text) =>{
      return iconv.decode(text, "EUC-KR");
  }

  //크롤링
  await axios({url:kospiUrl, method:"POST",responseEncoding:"binary"}).then(response => {
      const $ = cheerio.load(decodeText(response.data));
      $(".type_2 .no").each((index, item) => {
        let data = {
              id       : $(item).next().find("a").attr("href").split("=")[1],
              stockName: $(item).next().text(),
              currentAmount: $(item).next().next().text(),
              changedPrice : $(item).next().next().next().text().replace(/\s/g, ""),
              changedRatio : $(item).next().next().next().next().text().replace(/\s/g, "")
          };
          
          //전일비 부호 셋팅
          if(data.changedRatio != '0.00%'){
            data.changedPrice = data.changedRatio.substr(0,1) + data.changedPrice;
          }
          
          stockDataList.push(data);
      });
  }).catch(error => {
      console.log(error);
  });

//   stockDataList = stockDataList.filter((item) => {
//       return item.frnAmount != "0" && item.orgAmount != "0";
//   });

  return stockDataList;
}



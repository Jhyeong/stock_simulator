import axios from 'axios';
import cheerio from 'cheerio';
import iconv from 'iconv-lite';

export default async (req, res) => {
    res.status(200).json(await callStockData(req.query.type))
}

/**
 * 종목뉴스
 * 
 * @param {}} type 
 * @returns 
 */
const callStockData = async (stockCode) => {
  const url = "https://finance.naver.com/item/news_news.nhn?code=" + stockCode + "&page=1&sm=title_entity_id.basic";
  let stockData = [];
  // EUC-KR로 디코딩
  const decodeText = (text) =>{
      return iconv.decode(text.trim(), "EUC-KR");
  }
  //크롤링 실행
  await axios({url:url, method:"POST",responseEncoding:"binary"}).then(response => {
      const $ = cheerio.load(response.data);
      $(".tb_cont .title").each((index, item) => {
          //console.log(decodeText($(item).text()))
          const data = {
              id            : index,
              title         : decodeText($(item).text()),
              dateTime      : decodeText($(item).next().next().text().substr(0,11)),
          }

          stockData.push(data);
      });
  }).catch(error => {
      console.log(error);
  });
  return stockData;
}



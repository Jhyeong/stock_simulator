import React from 'react';
import Link from 'next/link';
import { makeStyles } from '@material-ui/core/styles';
import { Card, CardContent} from '@material-ui/core';

const useStyles = makeStyles({
  root: {
    minWidth: 275,
  },
  cardArea: {
    width : '20%',
    left: '30%',
    top: '30%',
    cursor: 'pointer',
    textAlign:'center',
    marginRight: 150,
    float: 'left',
  },
  icons: {
    width : '100%',
  },
  title: {
    marginTop: 50,
  }
});

const Index = (props) => {
  const classes = useStyles();

  return(
    <div className={classes.root}>
        {/* 코인 */}
        <div className={classes.cardDiv}>
          <Link href="/CoinInfo">
            <Card className={classes.cardArea}>
                <CardContent>
                  <img className={classes.icons} src="/BTCIcon.png"/>
                  <h1 className={classes.title}>코인</h1>
                </CardContent>
            </Card>
          </Link>
        </div>
        {/* 주식 */}
        <Link href="/KospiTop50">
          <Card className={classes.cardArea}>
              <CardContent>
                <img className={classes.icons} src="/STOCKIcon.png"/>
                <h1 className={classes.title}>주식</h1>
              </CardContent>
          </Card>
        </Link>
    </div>
  );
}

export default Index;
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Card, CardContent, Input, InputLabel, InputAdornment, InputBase, IconButton } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

const useStyles = makeStyles({
    root: {
      minWidth: 275,
    },
    stockList:{
        width: 300,
        float: 'left',
        marginRight: 20,
        paddingLeft: 25,
    },
    chart: {
        width: 750,
    },
    iconButton: {
        padding: 10,
    },
});

const Simulation = () => {
    const classes = useStyles();

    return(
        <div className={classes.root}>
            {/* 주식종목 리스트 */}
            <Card className={classes.stockList}>
                <CardContent>
                    <Input
                        className={classes.search}
                        placeholder="주식종목"
                    />
                    <IconButton type="submit" className={classes.iconButton}>
                        <SearchIcon />
                    </IconButton>
                </CardContent>
            </Card>
            {/* 주식차트 */}
            <Card className={classes.chart}>
                <CardContent>
                    <img
                        src="https://ssl.pstatic.net/imgfinance/chart/item/candle/day/005930.png"
                        alt="Picture of the author"
                    />
                </CardContent>
            </Card>
        </div>
    );
}

export default Simulation;
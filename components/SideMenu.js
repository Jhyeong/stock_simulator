import React from 'react';
import Link from 'next/link';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Collapse from '@material-ui/core/Collapse';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import StarBorder from '@material-ui/icons/StarBorder';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

const useStyles = makeStyles((theme) => ({
    root : {
        display: 'flex',
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    hide: {
        display: 'none',
    },
    drawer: props => ({
        width: props.drawerWidth,
        flexShrink: 0,
    }),
    drawerPaper: props => ({
        width: props.drawerWidth,
    }),
    drawerHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0, 1),
        // necessary for content to be below app bar
        ...theme.mixins.toolbar,
        justifyContent: 'flex-end',
    },
    }));

const SideMenu = (props) => {
    const classes = useStyles(props);
    const theme = useTheme();
    const url = {"FrnOrgTrade" : "/FrnOrgTrade"};
    const [smallMenuOpen, setSmallMenuOpen] = React.useState(true);

    // 메뉴바 handling
    const handleMenu = () => {
        props.setOpen(false);
    };

    // 특징주 소메뉴 handling
    const handleSmallMenu = () => {
        if(smallMenuOpen){
            setSmallMenuOpen(false);
        }else{
            setSmallMenuOpen(true);
        }
    }

    return(
        // 메뉴 핸들링
        <Drawer
            className={classes.drawer}
            variant="persistent"
            anchor="left"
            open={props.open}
            classes={{
            paper: classes.drawerPaper,
            }}
        >
            <div className={classes.drawerHeader}>
                <IconButton onClick={handleMenu}>
                    {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
            </div>
        <Divider />
        {/* 코인 */}
        <List>
            <ListItem button onClick={handleSmallMenu}>
                <ListItemIcon><InboxIcon /></ListItemIcon>
                <ListItemText primary={'코인'} />
                {smallMenuOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={smallMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {/* 코인정보 */}
                    <Link href="/CoinInfo">
                        <ListItem button className={classes.nested}>
                            <ListItemIcon>
                            <StarBorder />
                            </ListItemIcon>
                            <ListItemText primary="코인정보" />
                        </ListItem>
                    </Link>
                </List>
            </Collapse>
        </List>
        <Divider />
        {/* 주식 */}
        <List>
            <ListItem button onClick={handleSmallMenu}>
                <ListItemIcon><InboxIcon /></ListItemIcon>
                <ListItemText primary={'주식'} />
                {smallMenuOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={smallMenuOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {/* 시가총액 상위50 */}
                    <Link href="/KospiTop50">
                        <ListItem button className={classes.nested}>
                            <ListItemIcon>
                            <StarBorder />
                            </ListItemIcon>
                            <ListItemText primary="시가총액 상위50" />
                        </ListItem>
                    </Link>
                    {/* 외국인/기관 매매 */}
                    <Link href="/FrnOrgTrade">
                        <ListItem button className={classes.nested}>
                            <ListItemIcon>
                            <StarBorder />
                            </ListItemIcon>
                            <ListItemText primary="외국인/기관 매매" />
                        </ListItem>
                    </Link>
                </List>
            </Collapse>
        </List>
        <Divider />
        </Drawer>
    );
};

export default SideMenu;
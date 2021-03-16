import React from 'react'
import Contents from './Contents';
import Header from './Header'
import SideNav from './SideNav'
  
const Layout = ({children}) => {
    const [open, setOpen] = React.useState(false);
    const drawerWidth = 240;

    return (
        <div>
            <Header open={open} setOpen={setOpen} drawerWidth={drawerWidth}></Header>
            <SideNav open={open} setOpen={setOpen} drawerWidth={drawerWidth}></SideNav>
            <Contents open={open} drawerWidth={drawerWidth}>
                {children}
            </Contents>
        </div>
    );
};

export default Layout;
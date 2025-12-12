import * as React from 'react';
import HeatmapGL from './heatmapGL';
import { useAppDispatch } from './hooks/hooks';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import ControlPanel from './control-panel';
import OnlineStatusBox from './components/onlineStatus/onlineStatusBox';

/**
 * Parent component to layout all components. Currently using the grid layout from material ui. 
 */
function SurfaceLayout() {
    const dispatch = useAppDispatch();
    const gridContainer = {
        display: "grid",
        gridTemplateColumn: "repeat(5, 1fr)",
        gridAutoFlow: "column"
    };

    const gridContainer2 = {
        display: "grid",
        gridAutoColumns: "1fr",
        gridAutoFlow: "row"
    };

    const gridItem = {
        margin: "8px",
        // border: "1px solid red",
    };

    return (
        <>
            <div>
                <Box sx={gridContainer2}>
                    <Box sx={gridItem} ><Box sx={{ height: "80vh" }}><HeatmapGL /></Box> </Box>
                    <Box sx={gridItem}>
                        {/* <Box sx={{
                            display: { xs: 'none', md: 'none', lg: 'block' },
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: "300px",
                            background: "#fff",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                            padding: "12px 24px",
                            margin: "20px",
                            fontSize: "13px",
                            lineHeight: 2,
                            color: "#6b6b76",
                            textTransform: "uppercase",
                            outline: "none"
                        }}>
                            <ControlPanel
                                minSignal={0}
                                maxSignal={-160}

                            />
                        </Box> */}
                        <Box sx={{
                            display: { xs: 'block', md: 'block', lg: 'block' },
                            position: "relative",
                            width: "95%",
                            background: "#fff",
                            // boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                            marginLeft: "auto",
                            align: "center",
                            marginRight: "auto",
                            // margin: "50px",
                            fontSize: "13px",
                            lineHeight: 2,
                            color: "#6b6b76",
                            textTransform: "uppercase",
                            outline: "none"
                        }}>
                            <ControlPanel
                                minSignal={0}
                                maxSignal={-160}
                            />
                        </Box>
                    </Box>
                    <Box sx={gridItem}>
                        <Box sx={gridItem}> <OnlineStatusBox style={{ width: "45vw" }} /></Box>
                        {/* <Box sx={gridItem}>  <OnlineStatusBox style={{ width: "45vw" }} /></Box> */}
                    </Box>
                </Box>
            </div>
        </>
    );
}

const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
}));


export default SurfaceLayout;
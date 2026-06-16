import {latLngToCell} from "h3-js";


const generateH3Cell = (lat,lng,resolution)=>{
    return latLngToCell(lat,lng,resolution);
    
}
 
export{
    generateH3Cell
}
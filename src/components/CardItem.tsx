// import { Card, CardDescription, CardHeader, CardTitle}from "./ui/card"
import Rank from './Rank.tsx'
import ArtistImg from "./ArtistImg";
import Genre from "./Genre";

const CardItem = (props) => {
// const specsObj = 'flex flex-row justify-items-between text-black-500 bg-emerald-500 w-25'

    return (
        <div>
            <div className="flex justify-between text-black-500 bg-emerald-500 border-black p-1 m-2">
                <h1>TOP(artist)</h1>
                //four divs to handle state 
                <div id='rank'> <Rank /></div>
                {/* <div id='artist name'><Artists/></div> */}
                <div id='artistimg'><ArtistImg /> </div>
                <div id='genre'><Genre /></div>  
            </div>
        </div>
    )
}

export default CardItem;
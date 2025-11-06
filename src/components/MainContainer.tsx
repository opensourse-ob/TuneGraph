// import {useEffect, useState} from 'react'
import NavBar from "./NavBar.tsx";
import { Button } from "./ui/button.tsx";
import OneTab from './Card';
import { Clock, Music, Headphones, ArrowUp } from "lucide-react"; 
import TopArtists from "./TopArtists.tsx";


const MainContainer = (props) => {
 
    const classNameInfo = 'bg-black hover:bg-gray-800 text-emerald-500 border-2 border-emerald-500 font-bold py-1 m-5 p-5 px-2 rounded'

    const timeLines = ['last 4 weeks', 'last 6 months', 'all time', 'trish', 'dylan', 'shuangfei'];
    const cardNames = ['total played minutes', "tracks played", "artists discovered", "listening hours"];

    const iconClock = Clock;
    const iconMusic = Music;
    const iconHeadphones = Headphones;
    const iconArrowUp = ArrowUp; 
    const icons = [iconClock, iconMusic, iconArrowUp, iconHeadphones];

    // const tabs = timeLines.map((timeLine, index) => {
    //    return <OneTab className={classNameInfo} key={index} timeline={timeLine} cardNames={cardNames} icons={icons} />
    //  });
    

    
    return (
        <>
        <div className="grid place-content-center justify-center bg-black p-1" >            
            <div><nav className="grid border-2 border-emerald-500 bg-black p-1 m-2 rounded-md">
                <h2 className="grid justify-center align-center text-3xl text-emerald-400 bg-black ">TuneGraph</h2>
                    <div className="flex justify-center align-items-center">
                    <p><Button className = {classNameInfo} >share on instagram</Button>
                    <Button  className={classNameInfo}>share on google</Button>
                    <Button  className={classNameInfo}>share on discord</Button></p> 
                    </div></nav>
                <div className="flex flex-col bg-black justify-center border-4 border-emerald-500 w-full rounded-lg">
                <NavBar />
                {/* {tabs} */}
                <TopArtists/>
                </div>
            </div>
        </div>
        </>
    )
}
export default MainContainer;
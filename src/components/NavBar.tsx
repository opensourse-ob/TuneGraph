import { Tabs } from "./ui/tabs";

const NavBar = (props) => {

    return (
        <div className=" bg-black">
        <div className="flex flex-row justify-between bg-black m-8 border-2 border-emerald-500">
            <Tabs className="text-emerald-500" >Total Minutes:  </Tabs>
        </div> 
        </div>
    )
}
//main name and share button
//nav bar into flexblock, flex row space between thn margins
export default NavBar;
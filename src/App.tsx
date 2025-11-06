import { useState, useEffect } from 'react'
import './App.css'
import LoginCard from './components/LoginCard';
import MainContainer from './components/MainContainer';
// import {SpotifyTokenResponse} from '../server/routes/auth.ts'

interface ApiResponse {
  message?: string;
  data?: string;
  method?: string;
  query?: Record<string, string>;
  status?: string;
  timestamp?: string;
}

function App() {

//     const timeLines = ['last 4 weeks', 'last 6 months', 'all time', 'trish', 'dylan', 'shuangfei'];
//     const cardNames = ['total played minutes', "tracks played", "artists discovered", "listening hours"];
//     const iconClock = Clock;
//     const iconMusic = Music;
//     const iconHeadphones = Headphones;
//     const iconArrowUp = ArrowUp; 

//     const icons = [iconClock, iconMusic, iconHeadphones, iconArrowUp];

//     const tabs = timeLines.map((timeLine, index) => {
//        return <OneTab key={index} timeline={timeLine} cardNames={cardNames} icons={icons} />
//   });
    
  const [apiData, setApiData] = useState<ApiResponse | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const checkAuthentication = async () => {
    try{
      const res = await fetch('api/auth/status', {
        credentials: 'include' // sends cookies with request
      })
      // console.log('res:',res)
      const data = await res.json();
      console.log('data:', data)
      setIsAuthenticated(data.authenticated);
    }catch(err){
      console.log('Error checking auth:', err)
      setIsAuthenticated(false);
    }finally {
      setIsLoading(false)
    }
  };

  useEffect(() => {
//     // Handle OAuth callback - check URL params
//     // check if the url contains '?auth=success'

    const urlParams = new URLSearchParams(window.location.search) // Parses query parameters
    const authParam = urlParams.get('auth'); // Gets the auth param (set by backend)
    const errorParam = urlParams.get('error'); // Gets error param (if there is one)

    if(authParam === 'success'){
      // User just completed OAuth flow
      // Clean up the URL
      // https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState
      window.history.replaceState({}, '', window.location.pathname)
      checkAuthentication();
    }else if(errorParam) {
      //OAuth failed - user denied access
      console.error('Auth error:', errorParam)
      setIsLoading(false);
    }else{
      // Normal page load
      checkAuthentication();
    }
    }  ,[])

return (
  <>
  <div className='bg-black'> 
  {isLoading ? (
    <div>Loading...</div>
  ): (
    <>
    <div >
    {isAuthenticated ? (
      <MainContainer datatest="apiData" />
    ) : (
      <>
      <LoginCard />
      
      </>
    )}
    </div>
    </>
  )}
</div>
  </>
)}
export default App

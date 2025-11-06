import { Card, CardAction } from "./ui/card";
import { Button } from "./ui/button";

const LoginCard = () => {
    // const navigate = useNavigate(); 
    // const [login, setLogin] = useState(false)

    const handleLogin = () => {
    const spotifyLogin = '/api/auth/login'
    window.location.href = spotifyLogin
    };
    

    return (
        <div>
            <Card>
                <CardAction>
                    <Button onClick={handleLogin} className="flex-row justify-content-center">
                        Login with Spotify
                    </Button>
                </CardAction>
            </Card>
        </div>
    );
}
export default LoginCard;
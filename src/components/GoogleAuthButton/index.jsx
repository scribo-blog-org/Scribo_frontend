import { useGoogleLogin } from '@react-oauth/google';
import { ReactComponent as GoogleIcon } from "../../assets/svg/google-icon.svg"


const GoogleAuthButton = ({ setGoogleToken }) => {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setGoogleToken(tokenResponse.access_token)
    }
  });

  return (
    <button type="button" className="google_auth_button app-transition" onClick={login}>
      <GoogleIcon/>
      Продолжить через Google
    </button>
  );
};

export default GoogleAuthButton;

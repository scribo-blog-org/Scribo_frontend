import { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../App';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { Link } from 'react-router-dom';
import InputField from '../../components/InputField/index';
import "./Login.scss";
import GoogleAuthButton from '../../components/GoogleAuthButton/index';

const Login = () => {
    const navigate = useNavigate(); 
    const [ googleToken, setGoogleToken ] = useState(null)
    const [ fields, setFields ] = useState(
        {
            user_login: '',
            password: '',
        }
    )
    const [errors, setErrors] = useState({}); 
    const { showToast } = useContext(AppContext); 
   
    useEffect(() => {
        const do_login = async () => {
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ google_token: googleToken }),
            }
            
            const login = await fetch(`${API_URL}/api/auth/login`, requestOptions)
            const result = await login.json()

            if(result.status === true) {
                localStorage.setItem('token', result.data.token); 
                navigate('/posts');
                showToast({ message: 'Вы вошли в аккаунт!', type: 'success' }); 
            }
            else {
                if(login.status === 404) {
                    navigate('/auth/register', {
                        state: {
                            google_token: googleToken,
                            email: result.data.email
                        }
                    });
                }
                else {
                    throw new Error(`Invalid google goken ${result}`)
                }
            }
        }

        if(googleToken) {
            do_login()
        }
    }, [googleToken, navigate, showToast]);

    const handleFocus = (fieldName) => {
        const { [fieldName]: removedField, ...other } = errors;
        setErrors (other)
    }

    const field_validation = () => {
        let is_error = false
        if (fields.user_login.length < 3) {
            setErrors(prevErrors => ({
                ...prevErrors,
                user_login: "User login must be at least 3 characters long!"
            }));
            is_error = true
        }
        if (fields.user_login.length > 60) {
            setErrors(prevErrors => ({
                ...prevErrors,
                user_login: "User login cannot be longer than 60 characters!"
            }));
            is_error = true
        }
        if (fields.password.length < 8) {
            setErrors(prevErrors => ({
                ...prevErrors,
                password: "Password must be at least 8 characters long!"
            }));
            is_error = true
        }
        if (fields.password.length > 20) {
            setErrors(prevErrors => ({
                ...prevErrors,
                password: "Password cannot be longer than 20 characters!"
            }));
            is_error = true
        }
        return !is_error
    }

    const handleLogin = async () => {
        if(!field_validation()) {
            return
        }
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_login: fields.user_login, password: fields.password }),
        }
        try {
            const login = await fetch(`${API_URL}/api/auth/login`, requestOptions)
            const result = await login.json() 
            if (result.status === true) { 
                localStorage.setItem('token', result.data.token); 
                navigate('/posts');
                showToast({ message: 'Вы вошли в аккаунт!', type: 'success' }); 
                return result; 
            } 
            else { 
                showToast({ message: 'Неверно!', type: 'error' }); 
                if (result?.errors?.body) {
                    const formattedErrors = Object.fromEntries(
                        Object.entries(result.errors.body).map(
                            ([field, obj]) => [field, obj.message]
                        )
                    );

                    setErrors(formattedErrors);
                }
        
                return result; 
            } 
        }
        catch (e) { 
            console.log(e)
        } 
    };
 
  return (
    <form className='form_input app-transition'>
        <InputField
            className={`user_login`}
            type="text"
            onChange={(e) => setFields({ ...fields, user_login: e.target.value })}
            onFocus={() => handleFocus('user_login')}
            input_label="Логин"
            placeholder="Введите имя пользователя или email"
            value={fields.user_login}
            error={errors?.user_login ?? null}
        />
        <InputField
            className={`password`}
            type="password"
            onChange={(e) => setFields({ ...fields, password: e.target.value })}
            onFocus={() => handleFocus('password')}
            input_label="Пароль"
            placeholder="Введите пароль"
            value={fields.password}
            error={errors?.password ?? null}
        />
        <button className="submit_button app-transition" onClick={handleLogin} type="button">Войти</button>
        <GoogleAuthButton setGoogleToken={setGoogleToken}/>
        <p className={"redirect_object"}>Нет акаунта?
        <Link to={"/auth/register"}>
            Зарегестрироваться.
        </Link>
        </p>
    </form>
  );
};

export default Login;

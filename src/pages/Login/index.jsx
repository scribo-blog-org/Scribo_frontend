import { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../App';
import { useNavigate, Link } from 'react-router-dom';

import InputField from '../../components/Ui/InputField/index';
import PrimaryButton from '../../components/Ui/PrimaryButton';
import Field from '../../components/Ui/Field/index';

import { verificationGoogle, loginGoogle, loginUsername } from '../../api/auth.api';
import { FIELD_LIMITS } from '../../constants/fieldLimits';

import "../Auth/Auth.scss";

import GoogleAuthButton from '../../components/GoogleAuthButton/index';

const Login = () => {
    const navigate = useNavigate(); 
    const [ googleToken, setGoogleToken ] = useState(null)
    const [ pendingAuth, setPendingAuth ] = useState(null)
    const [ fields, setFields ] = useState(
        {
            userName: '',
            userPassword: '',
        }
    )
    const [errors, setErrors] = useState({}); 
    const { showToast } = useContext(AppContext); 

    useEffect(() => {
        const do_login = async () => {
            setPendingAuth('google')
            try {
                const result = await verificationGoogle(googleToken)

                if(result.status === true) {
                    if(result.data.is_registered === true) {
                        await loginGoogle(googleToken)
                        navigate('/posts');
                        showToast({ message: 'Вы вошли в аккаунт!', type: 'success' });
                    }
                    else {
                        navigate('/auth/register', { state: { google_token: googleToken, email: result.data.email } });
                    }
                }
                else {
                    showToast({ message: 'Не удалось войти через Google', type: 'error' });
                    setPendingAuth(null)
                }
            }
            catch {
                showToast({ message: 'Не удалось войти через Google', type: 'error' });
                setPendingAuth(null)
            }
        }

        if(googleToken) {
            do_login()
        }
    }, [googleToken, navigate, showToast]);

    const handleFocus = (fieldName) => {
        const other = { ...errors };
        delete other[fieldName];
        setErrors(other);
    };

    const field_validation = () => {
        let is_error = false
        if (fields.userName.length < FIELD_LIMITS.login.min) {
            setErrors(prevErrors => ({
                ...prevErrors,
                userName: `Логин не короче ${FIELD_LIMITS.login.min} символов`
            }));
            is_error = true
        }
        if (fields.userName.length > FIELD_LIMITS.login.max) {
            setErrors(prevErrors => ({
                ...prevErrors,
                userName: `Логин не длиннее ${FIELD_LIMITS.login.max} символов`
            }));
            is_error = true
        }
        if (fields.userPassword.length < FIELD_LIMITS.password.min) {
            setErrors(prevErrors => ({
                ...prevErrors,
                userPassword: `Пароль не короче ${FIELD_LIMITS.password.min} символов`
            }));
            is_error = true
        }
        if (fields.userPassword.length > FIELD_LIMITS.password.max) {
            setErrors(prevErrors => ({
                ...prevErrors,
                userPassword: `Пароль не длиннее ${FIELD_LIMITS.password.max} символов`
            }));
            is_error = true
        }
        return !is_error
    }

    const handleLogin = async () => {
        if(!field_validation()) {
            return
        }
        
        setPendingAuth('password')
        let result
        try {
            result = await loginUsername(fields.userName, fields.userPassword)
        } finally {
            setPendingAuth(null)
        }
        
        if (result.status === true) { 
            navigate('/posts');
            showToast({ message: 'Вы вошли в аккаунт!', type: 'success' }); 
            return result; 
        } 
        else { 
            showToast({ message: 'Неверно!', type: 'error' }); 
            if (result?.errors?.body) {
                setErrors(Object.fromEntries(Object.entries(result.errors.body).map(([field, obj]) => [field, obj.message])));
            }
    
            return result; 
        }
    };
 
  return (
    <div className="auth_page">
        <form className="form_input" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div className="auth_page_stack">
                <h1 className="auth_page_title">Вход</h1>
                <div className="auth_page_group section app-transition">
                    <Field title="Логин" error={errors?.userName ?? null}>
                        <InputField
                            className={`userName`}
                            type="text"
                            onChange={(e) => setFields({ ...fields, userName: e.target.value })}
                            onFocus={() => handleFocus('userName')}
                            placeholder="Имя пользователя или email"
                            value={fields.userName}
                            error={errors?.userName ?? null}
                            length={FIELD_LIMITS.login.max}
                        />
                    </Field>
                    <Field title="Пароль" error={errors?.userPassword ?? null}>
                        <InputField
                            className={`userPassword`}
                            type="password"
                            onChange={(e) => setFields({ ...fields, userPassword: e.target.value })}
                            onFocus={() => handleFocus('userPassword')}
                            placeholder="Введите пароль"
                            value={fields.userPassword}
                            error={errors?.userPassword ?? null}
                            length={FIELD_LIMITS.password.max}
                        />
                    </Field>
                    <div className="auth_page_forgot">
                        <Link to="/auth/forgot-password">Забыли пароль?</Link>
                    </div>
                    <PrimaryButton
                        type="submit"
                        isLoading={pendingAuth === 'password'}
                        disabled={Boolean(pendingAuth)}
                    >
                        Войти
                    </PrimaryButton>
                </div>
            </div>
            <p className="auth_page_or">или</p>
            <GoogleAuthButton
                setGoogleToken={setGoogleToken}
                isLoading={pendingAuth === 'google'}
                disabled={pendingAuth === 'password'}
                onClickStart={() => setPendingAuth('google')}
                onAuthEnd={() => setPendingAuth(null)}
            />
            <p className="redirect_object">
                Нет аккаунта?
                <Link to={"/auth/register"}>Зарегистрироваться</Link>
            </p>
        </form>
    </div>
  );
};

export default Login;

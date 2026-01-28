import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useContext, useEffect, useState, useRef } from 'react';
import { AppContext } from '../../App';
import { API_URL } from '../../config';
import InputField from '../../components/InputField/index';
import DropFile from '../../components/DropFile/index';
import "./Register.scss";
import { ReactComponent as AvatarIcon } from "../../assets/svg/avatar-icon.svg"
import GoogleAuthButton from '../../components/GoogleAuthButton/index';

const RegisterForm = ({ email = null, google_token = null, gmail_code = null }) => {
    const navigate = useNavigate();

    const [ fields, setFields ] = useState(
        {
            nick_name: '',
            password: '',
            description: '',
            avatar: null
        }
    )
    const [errors, setErrors] = useState({});
    const { showToast } = useContext(AppContext);
    
    if(!(google_token || (email && gmail_code))) {
        return <></>
    }

    const add_errors_to_image = (new_errors) => {
        const updated_errors = { ...errors };

        if (!updated_errors.featured_image) { 
            updated_errors.featured_image = [];
        }

        for(const new_error of new_errors) {
            updated_errors.featured_image.push(new_error)
        }
        setErrors(updated_errors);
    }

    const clear_errors_from_image = () => {
        const updated_errors = { ...errors };

        if(updated_errors.featured_image) {
            delete updated_errors.featured_image
        }

        setErrors(updated_errors)
    }

    const handleFocus = (fieldName) => {
        const { [fieldName]: removedField, ...other } = errors;
        setErrors (other)
    }

    const field_validation = () => {
        let is_error = false
        if (fields.nick_name.length < 3) {
            setErrors(prevErrors => ({
                ...prevErrors,
                nick_name: "Username must be at least 3 characters long!"
            }));
            is_error = true
        }
        if (fields.nick_name.length > 20) {
            setErrors(prevErrors => ({
                ...prevErrors,
                nick_name: "Username cannot be longer than 20 characters!"
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
        if (fields.description.length > 60) {
            setErrors(prevErrors => ({
                ...prevErrors,
                password: "Description cannot be longer than 60 characters!"
            }));
            is_error = true
        }
        return !is_error
    }

    const handleRegister = async () => {
        if(!field_validation()) {
            return
        }

        const formData = new FormData();
        
        for(let field in fields) {
            formData.append(field, fields[field])
        }

        if(google_token) {
            formData.append("google_token", google_token)
        }
        else {
            formData.append("email", email)
            formData.append("code", gmail_code)
        }
        try {
            const register = await fetch(`${API_URL}/api/auth/register`, { method: "POST", body: formData });
            const result = await register.json();
            if (result.status === true) {
                navigate("/auth/login");
                showToast({ message: "Зарегистрировано!", type: "success" });
            } else {
                if (result?.errors?.body) {
                    const formattedErrors = Object.fromEntries(
                        Object.entries(result.errors.body).map(
                            ([field, obj]) => [field, obj.message]
                        )
                    );

                    setErrors(formattedErrors);
                }
                showToast({ message: "Ошибка!", type: "error" });
                return result;
            }
        } catch (error) {
            console.log(error);
            if(error instanceof TypeError && error.message === "Failed to fetch") {
                setErrors({
                    "avatar": [ "Max size of image is 5 mb"] 
                })
            }
            return { status: "error", message: "server not found" };
        }
    };

    const handleClick = () => {
        const { avatar: removedField, ...other } = errors;
        setErrors (other)
    }

    return (
        <form className='form_input app-transition'>
            <>
                <DropFile
                    value={fields.avatar}
                    setValue={(file) =>
                        setFields({ ...fields, avatar: file })
                    }
                    background={
                        <AvatarIcon className="drop_file_info_avatar_icon app-transition" />
                    }
                    drop_file_type="image/*"
                    file_types="SVG, PNG, JPEG, JPG и другие"
                    errors={errors?.featured_image}
                    add_new_errors={add_errors_to_image}
                    clear_errors={clear_errors_from_image}
                    onRemove={handleClick}
                /><InputField
                    className={`email`}
                    type="text"
                    onChange={(e) => setFields({ ...fields, email: e.target.value })}
                    onFocus={() => handleFocus('nick_name')}
                    input_label="Почта"
                    placeholder="Email"
                    value={email ?? fields.email}
                    error={errors?.email ?? null}
                    confirmed={Boolean(email)}
                />
                <InputField
                    className={`user_name`}
                    type="text"
                    onChange={(e) => setFields({ ...fields, nick_name: e.target.value })}
                    onFocus={() => handleFocus('nick_name')}
                    input_label="Имя пользователя"
                    placeholder="User Name"
                    value={fields.nick_name}
                    error={errors?.nick_name ?? null}
                />
                <InputField
                    className={`description`}
                    type="text"
                    is_multiline = {true}
                    length={30}
                    onChange={(e) => setFields({ ...fields, description: e.target.value })}
                    onFocus={() => handleFocus('description')}
                    input_label="Описание"
                    placeholder="Description of profile"
                    value={fields.description}
                    error={errors?.description ?? null}
                />
                <InputField
                    className={`password`}
                    type="password"
                    onChange={(e) => setFields({ ...fields, password: e.target.value })}
                    onFocus={() => handleFocus('password')}
                    input_label="Пароль"
                    placeholder="Password123"
                    value={fields.password}
                    error={errors?.password ?? null}
                />
                <button className="submit_button app-transition" type="button" onClick={handleRegister}>Зарегистрироваться</button>
                <p className={"redirect_object"}>Уже есть аккаунт?
                    <Link to={"/auth/login"}>Войти.</Link>
                </p>
            </>
        </form>
    );
};

const VerifyGmailCode = ({ email }) => {
    const CODE_LENGTH = 6

    const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
    const [errors, setErrors] = useState({});
    const [redigrectToForm, setRedigrectToForm] = useState(false)
    const inputsRef = useRef([]);

    if (!email) return null;

    const handleChange = (e, index) => {
        const value = e.target.value.replace(/\D/g, "");
        if (!value) return;

        const newCode = [...code];
        newCode[index] = value[value.length - 1];
        setCode(newCode);

        if (index < CODE_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace") {
            const newCode = [...code];

            if (code[index]) {
                newCode[index] = "";
                setCode(newCode);
            } else if (index > 0) {
                inputsRef.current[index - 1]?.focus();
            }
        }
    };

    const handleSubmit = async () => {
        const fullCode = code.join("");

        if (fullCode.length !== CODE_LENGTH) {
            setErrors({ code: " " });
            return;
        }

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                code: fullCode,
            })
        }
        const verification = await fetch(`${API_URL}/api/auth/email/verification/confirm`, requestOptions)

        if(verification.status === 200) {
            setRedigrectToForm(true)
        }
        if(verification.status === 401) {
            setErrors({ "code": " " })
        }
    };

    return (
        redigrectToForm ? <RegisterForm email={email} gmail_code={code.join("")}/> : 
        <form className="form_input app-transition">
            <div className="otp_container">
                <div className='otp_container_title'>
                    <p>Введите код, отправленный на </p>
                    <p className='otp_container_title_email'>{email}</p>
                </div>
                <div className='otp_container_content'>
                    {code.map((digit, index) => (
                        <InputField
                        key={index}
                        ref={(el) => (inputsRef.current[index] = el)}
                        className="otp_input"
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={() => setErrors({})}
                        error={errors?.code ?? null}
                        placeholder=""
                        input_label=""
                        />
                    ))}
                </div>
            </div>

            <button
                className="submit_button app-transition"
                type="button"
                onClick={handleSubmit}
            >
                Отправить
            </button>
        </form>
    );
};

const Register = () => {
    const { email, google_token, gmail_code } = useLocation().state || {};
    const navigate = useNavigate();
    
    const [ fields, setFields ] = useState({ email: '' })
    const [errors, setErrors] = useState({});
    const { showToast } = useContext(AppContext);
    const [googleToken, setGoogleToken] = useState();
    const [gmailCodeSedned, setGmailCodeSedned] = useState(false);

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

    if (google_token || (email && gmail_code)) {
        return <RegisterForm email={email ?? null} google_token={google_token ?? null} gmail_code={gmail_code ?? null}/>
    }

    const handleFocus = (fieldName) => {
        const { [fieldName]: removedField, ...other } = errors;
        setErrors (other)
    }

    const field_validation = () => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
            setErrors({
                email: "Incorrect email!"
            });
            return false
        }
        return true
    }

    const handleRegister = async () => {
        if(!field_validation()) {
            return
        }

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: fields.email
            })
        }
        const verification = await fetch(`${API_URL}/api/auth/email/verification/`, requestOptions)
        const result = await verification.json()

        if(verification.status === 200) {
            setGmailCodeSedned(true)
        }        
        if(verification.status === 409) {
            setErrors({
                email: result.message
            });
        }
    };

    return (
        gmailCodeSedned ? <VerifyGmailCode email={fields.email}/> : 
        <form className='form_input app-transition'>
            <>
                <InputField
                    className={`email`}
                    type="text"
                    onChange={(e) => setFields({ ...fields, email: e.target.value })}
                    onFocus={() => handleFocus('email')}
                    input_label="Почта"
                    placeholder="Email"
                    value={email ?? fields.email}
                    error={errors?.email ?? null}
                    confirmed={Boolean(email)}
                />
                <button className="submit_button app-transition" type="button" onClick={handleRegister}>Зарегистрироваться</button>
                <GoogleAuthButton setGoogleToken={setGoogleToken}/>
                <p className={"redirect_object"}>Уже есть аккаунт?
                    <Link to={"/auth/login"}>Войти.</Link>
                </p>
            </>
        </form>
    )
}

export default Register;

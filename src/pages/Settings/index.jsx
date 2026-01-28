import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../App';
import { API_URL } from '../../config';
import InputField from '../../components/InputField/index';
import DropFile from '../../components/DropFile/index';
import Toggle from '../../components/Toggle/index';
import "./Settings.scss";
import { ReactComponent as AvatarIcon } from "../../assets/svg/avatar-icon.svg"

const Settings = () => {
    const { profile, setProfile, profileLoading,showToast } = useContext(AppContext)
    const [ initialized, setInitialized ] = useState(false);
    const navigate = useNavigate();
    const [errors, setErrors] = useState({})

    const [ fields, setFields ] = useState(
        {
            nick_name: '',
            description: '',
            is_email_public: false,
            avatar: null
        }
    )

    const set_email_visibility = (visibility) => {
        setFields(prev => ({
            ...prev,
            is_email_public: visibility
        }))
    }

    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
            return;
        }

        if (!profileLoading && (!profile)) {
            navigate("/posts");
            return;
        }

        const setProfileData = async () => {
            if (!profile) return;

            setFields(prev => ({
                ...prev,
                nick_name: profile.nick_name ?? "",
                description: profile.description ?? "",
                avatar: profile.avatar,
                is_email_public: profile.is_email_public
            }));
        };

        setProfileData();
    }, [profileLoading, profile, initialized, navigate]);

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
        if (fields.description.length > 60) {
            setErrors(prevErrors => ({
                ...prevErrors,
                password: "Description cannot be longer than 60 characters!"
            }));
            is_error = true
        }
        return !is_error
    }

    const save_settings = async () => {
        if(!field_validation()) {
            return
        }

        const formData = new FormData();
        
        for(let field in fields) {
            if(field === 'avatar') {
                if(typeof fields.avatar === 'string' && fields.avatar === profile.avatar) {
                    continue
                }
                formData.append('avatar', fields.avatar)
            } else {
                if(fields[field] === profile[field]) continue
                formData.append(field, fields[field])
            }
        }

        const headers = {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
        }
        
        try {
            const register = await fetch(`${API_URL}/api/profile/`, { method: "PATCH", body: formData, headers: headers });
            const result = await register.json();
            
            if (result.status === true) {
                setProfile(prev => ({
                    ...prev,
                    ...result.data
                }));
                navigate(result.data.nick_name ? `/users/${result.data.nick_name}` : `/users/${profile.nick_name}`);
                showToast({ message: "Успешно сохранено!", type: "success" });
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

    const logout = () => {
        localStorage.removeItem("token");
        showToast({ message: "Вы вышли из аккаунта!", type: "success" });
        navigate("/posts");
    }

    const handleAvatarRemove = () => {
        setFields(prev => ({
            ...prev,
            avatar: null
        }));
    };

    return (
        <div className='settings'>
            <form className='form_input app-transition'>
                <>
                    <div className='top_side'>
                        <DropFile
                            value={fields.avatar}
                            setValue={(file) =>
                                setFields(prev => ({ ...prev, avatar: file }))
                            }
                            background={<AvatarIcon className="drop_file_info_avatar_icon app-transition" />}
                            drop_file_type={"image/*"}
                            file_types={"SVG, PNG, JPEG, JPG и другие"}
                            errors={errors?.avatar}
                            add_new_errors={add_errors_to_image}
                            clear_errors={clear_errors_from_image}
                            onRemove={handleAvatarRemove}
                            preview_url={profile?.avatar}
                        />
                        <div className='email'>
                            <p className='email_label'>
                                {profile?.email}
                            </p>
                        </div>
                    </div>
                        <div className='email_private_setting'>
                            <div className='email_private_setting_title'>
                                <p>Приватность</p>
                            </div>
                            <div className='email_private_setting_content app-transition'>
                                <div className='email_private_setting_content_item'>
                                    <p>Отображать мой email в профиле</p>
                                    <Toggle 
                                        checked={fields.is_email_public}
                                        onChange={set_email_visibility}
                                    />
                                </div>
                            </div>
                        </div>
                    <InputField
                        className={`user_name`}
                        type="text"
                        onChange={(e) => setFields({ ...fields, nick_name: e.target.value })}
                        onFocus={() => handleFocus('nick_name')}
                        input_label="Имя пользователя"
                        placeholder="User Name"
                        value={fields?.nick_name}
                        error={errors?.nick_name ?? null}
                    />
                    <InputField
                        className={`description`}
                        type="text"
                        is_multiline = {true}
                        length={60}
                        rows={3}
                        onChange={(e) => setFields({ ...fields, description: e.target.value })}
                        onFocus={() => handleFocus('description')}
                        input_label="Описание"
                        placeholder="Description of profile"
                        value={fields?.description}
                        error={errors?.description ?? null}
                    />
                    <div className='form_input_buttons'>
                        <button className="submit_button app-transition" type="button" onClick={save_settings}>Сохранить</button>
                        <button className="logout_button app-transition" type="button" onClick={logout}>Выйти с аккаунта</button>
                    </div>
                </>
            </form>
        </div>
    );
};


export default Settings;

import { useNavigate } from 'react-router-dom';
import DropFile from '../../components/Ui/DropFile/index';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../App';
import { API_URL } from '../../config';
import InputFiled from "../../components/Ui/InputField";
import TextEditorField from "../../components/Ui/TextEditorField";
import PrimaryButton from "../../components/Ui/PrimaryButton";
import DangerButton from "../../components/Ui/DangerButton";
import "./CreatePost.scss"

const CreatePost = () => {
    const navigate = useNavigate()
    const { profile, profileLoading, showToast } = useContext(AppContext)
    const [ initialized, setInitialized ] = useState(false);
    const [ createResult, setCreateResult ] = useState({})
    const [errors, setErrors] = useState({ });

    const [ fields, setFields ] = useState(
        {
            title: '',
            content_text: '',
            featured_image: null,
            category: ''
        }
    )

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

    useEffect(() => {
        if(initialized){
            if(!profileLoading && (!profile || !profile.is_admin)){
                navigate("/posts")
            }
        }
        else{
            setInitialized(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[profileLoading, initialized])

    const handleClick = () => {
        const { featured_image: removedField, ...other } = errors;
        setErrors (other)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const result = await create_post(fields.title, fields.mainText, fields.category)
        setCreateResult(result)
    }

    const handleFocus = (fieldName) => {
        setErrors(prevErrors => ({
            ...prevErrors,
            body: Object.fromEntries(
                Object.entries(prevErrors.body || {}).filter(
                    ([key]) => key !== fieldName
                )
            )
        }));
    };

    const create_post = async (title, mainText) => {
        const formData = new FormData();
        formData.append('title', title)
        formData.append('content_text', fields.content_text)
        formData.append('featured_image', fields.featured_image)
        formData.append('category', fields.category)

        const headers = {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
        }
        try{
            const creating = await fetch(`${API_URL}/api/posts`, { method: "POST", body: formData, headers: headers})
            const result = await creating.json()
            if(result.status === true) {
                navigate("/posts")
                showToast({ message: "Опубликовано!", type: "success" })
                return result
            }
            else{
                if(result?.errors && Object.keys(result?.errors).length > 0) {
                    setErrors(result.errors)
                }
                return result
            }
        } 
        catch(e){
            return {
                status: "error",
                message: "server not found"
            }
        }
    }

    return (
        <form className='create_post' onSubmit={handleSubmit}>
            <InputFiled 
                className={"create_post_title"  + (createResult.status === "error" && createResult.message === "Incorrect 'title'" ? " incorrect_field" : "")}
                placeholder={"Введите заголовок"}
                is_multiline={true}
                multiline_rows={1}
                onChange={(e) => setFields({ ...fields, title: e.target.value })}
                onFocus={() => handleFocus('title')}
                length={200}
                error={errors?.body?.title?.message}
            />
            <InputFiled 
                className={"create_post_category"  + (createResult.status === false && createResult?.message?.body?.category ? " incorrect_field" : "")}
                placeholder={"Укажите категорию"}
                is_multiline={true}
                multiline_rows={1}
                onChange={(e) => setFields({ ...fields, category: e.target.value })}
                onFocus={() => handleFocus('category')}
                length={50}
                error={errors?.body?.category?.message}
            />
            <DropFile setValue={(file) => setFields({ ...fields, featured_image: file })} drop_file_type={"image/*"} file_types={"SVG, PNG, JPEG, JPG и другие"} errors={errors?.body?.featured_image?.message} add_new_errors={add_errors_to_image} clear_errors={clear_errors_from_image} handleClick={handleClick}/>
            <TextEditorField onFocus={() => handleFocus('content_text')} onChange={(html) => setFields({ ...fields, content_text: html })} error={errors?.body?.content_text?.message}/>
            <div className="create_post_buttons">
                <PrimaryButton onClick={handleSubmit}>Создать пост</PrimaryButton>
                <DangerButton onClick={() => navigate("/posts")}>Отмена</DangerButton>
            </div>
        </form>
    )
}

export default CreatePost

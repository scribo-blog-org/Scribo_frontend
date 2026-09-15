import { getAllLogs } from "../../api/logs.api";
import { getUsers } from "../../api/users.api";

import { Children, useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { AppContext } from "../../App";

import { format_back, format_date_time } from "../../utils/format";
import { getCategories } from "../../api/categories.api";
import { getPosts } from "../../api/posts.api";

import EditIcon from "../../assets/svg/edit.svg?react";
import PlusIcon from "../../assets/svg/plus-icon.svg?react";
import DeleteIcon from "../../assets/svg/delete.svg?react";
import NewUserIcon from "../../assets/svg/new-user.svg?react";
import RedirectIcon from "../../assets/svg/redirect.svg?react";
import TagIcon from "../../assets/svg/tag.svg?react";
import CommentIcon from "../../assets/svg/comment.svg?react";
import FilterIcon from "../../assets/svg/filter.svg?react";

import SearchSelect from "../../components/Ui/SearchSelect";
import CancelButton from "../../components/Ui/CancelButton";
import Loading from "../../components/Ui/Loading";
import Tooltip from "../../components/Ui/Tooltip"; 
import UserBadge from "../../components/UserBadge/index";
import Category from "../../components/Category/index";
import Popup from "../../components/Ui/Popup";
import ChipButton from "../../components/Ui/ChipButton";
import RoleBadge from "../../components/RoleBadge/index";
import { PostEntityChip } from "../../components/PostEntity";
import { kindLabel, statusLabel } from "../Support/constants";

import Pagination from "../../components/Ui/Pagination";
import "./Logs.scss";
import "./Requests.scss";


const formatTime = (date) => {
    return (
        <Tooltip text={format_date_time(date)}>
            <p>{format_back(date)}</p>
        </Tooltip>
    )

};

const LogLayout = ({ action, user, time, children, setFilter, log }) => {
    return (
        <div className={`admin_panel_content_logs_page_item admin_panel_content_logs_page_item_${action?.className} app-transition`}>
            <div className="admin_panel_content_logs_page_item_left">
                {log.data?.user ? (
                    <UserEntity className="test" id={log.data.user} data={user} setFilter={setFilter} />
                ) : (
                    <GuestEntity email={log.data?.email} />
                )}
            </div>
            <div className="admin_panel_content_logs_page_item_center">
                {Children.toArray(children?.props?.children ?? children)[0]}
            </div>
            <div className="admin_panel_content_logs_page_item_object">
                {Children.toArray(children?.props?.children ?? children)[1]}
            </div>
            <div>
                {Children.toArray(children?.props?.children ?? children)[2]}
            </div>
            <div className="admin_panel_content_logs_page_item_time">
                {Children.toArray(children?.props?.children ?? children)[3] ?? (time && formatTime(time))}
            </div>
        </div>
    )
}

const UserEntity = ({ id, data, setFilter }) => {
    const navigate = useNavigate();
    const { showToast } = useContext(AppContext);

    return (
        <Popup body={[
            {
                title: "Перейти в профиль",
                onClick: () => {
                    data ? navigate(`/users/${data.nick_name}`) : showToast({
                        type: "error",
                        message: "Пользователь не найден"
                    })
                },
                icon: <RedirectIcon/>
            },
            {
                title: "Просмотреть действия пользователя",
                onClick: () => {
                    setFilter({
                        type: "user",
                        id: id
                    })
                },
                icon: <FilterIcon/>
            }
        ]}>
            <div className="admin_panel_content_logs_page_item_entity admin_panel_content_logs_page_item_entity_user">
                {
                    data ?
                        <UserBadge asLink={false} data={data} />
                        :
                        <>
                            <UserBadge asLink={false} data={{ nick_name: "" }} />
                            <div className="admin_panel_content_logs_page_item_entity_deleted">
                                <p> 
                                    DELETED
                                </p>
                            </div>
                        </>
                }
            </div>
        </Popup>
    )
}

const PostEntity = ({ id, data, setFilter }) => {
    const navigate = useNavigate();
    const { showToast } = useContext(AppContext);

    return (
        <Popup body={[
            {
                title: "Перейти к посту",
                onClick: () => {
                    data ? navigate(`/posts/${data._id}`) : showToast({
                        type: "error",
                        message: "Пост не найден"
                    })
                },
                icon: <RedirectIcon/>

            },
            {
                title: "Просмотреть историю поста",
                onClick: () => {
                    setFilter({
                        type: "post",
                        id: id
                    })
                },
                icon: <FilterIcon/>
            }
        ]}>
            <PostEntityChip title={data?.title} deleted={!data} />
        </Popup>
    )
}

const CategoryEntity = ({ id, data, setFilter }) => {
    const navigate = useNavigate();
    const { showToast } = useContext(AppContext);

    return (
        <Popup body={[
            {
                title: "Перейти к категории",
                onClick: () => {
                    data ? navigate(`/posts/?filter=${data._id}`) : showToast({
                        type: "error",
                        message: "Категория не найдена"
                    })

                },
                icon: <RedirectIcon/>

            },
            {
                title: "Просмотреть историю категории",
                onClick: () => {
                    setFilter({
                        type: "category",
                        id: id
                    })
                },
                icon: <FilterIcon/>
            }
        ]}>
            <div className="admin_panel_content_logs_page_item_entity admin_panel_content_logs_page_item_entity_category">
                {
                    data ? 
                        <Category category={data} isActive={true} onClick={() => {}} /> :
                    <div className="admin_panel_content_logs_page_item_entity admin_panel_content_logs_page_item_entity_category_deleted">
                    
                        <ChipButton >
                            <TagIcon/>
                            <p>
                                No longer exist
                            </p>
                        </ChipButton>
                    </div>
                }
            </div>
        </Popup>
    )
}

const RoleEntity = ({ data }) => {
    return (
        <div className="admin_panel_content_logs_page_item_entity admin_panel_content_logs_page_item_entity_role">
            {
                data ? 
                    <RoleBadge user={data} /> :
                    <div className="admin_panel_content_logs_page_item_entity admin_panel_content_logs_page_item_entity_role_deleted">
                        <ChipButton >
                            <p>
                                No longer exist
                            </p>
                        </ChipButton>
                    </div>
            }
        </div>
    )
}

const GuestEntity = ({ email }) => {
    return (
        <div className="admin_panel_content_logs_page_item_entity admin_panel_content_logs_page_item_entity_guest">
            <p>Гость{email ? ` · ${email}` : ""}</p>
        </div>
    )
}

const SupportEntity = ({ id, accessKey, kind, setFilter }) => {
    const navigate = useNavigate();
    const { showToast } = useContext(AppContext);

    return (
        <Popup body={[
            {
                title: "Открыть обращение",
                onClick: () => {
                    accessKey ? navigate(`/support/${accessKey}`) : showToast({
                        type: "error",
                        message: "Обращение не найдено"
                    })
                },
                icon: <RedirectIcon/>
            },
            {
                title: "История обращения",
                onClick: () => {
                    setFilter({
                        type: "support_request",
                        id
                    })
                },
                icon: <FilterIcon/>
            }
        ]}>
            <div className="admin_panel_content_logs_page_item_entity admin_panel_content_logs_page_item_entity_post">
                <CommentIcon/>
                <p>{kindLabel(kind) || "Обращение"}</p>
            </div>
        </Popup>
    )
}

const SupportStatusEntity = ({ status }) => {
    if (!status) {
        return null;
    }

    return (
        <span className={`support_status support_status_${status}`}>
            {statusLabel(status)}
        </span>
    );
}

const LOG_RENDERERS = {
    create_post: ({ log, posts, setFilter }) => (
        <>
            <div className="admin_panel_content_logs_page_item_message">
                <div className="admin_panel_content_logs_page_item_message_icon">
                    <PlusIcon/>
                </div>
                <p>Создал пост</p>
            </div>
            <PostEntity id={log.data.post} data={posts.find(p => p._id === log.data.post)} setFilter={setFilter} />
        </> 
    ),

    update_post: ({ log, posts, setFilter }) => (
        <>
            <div className="admin_panel_content_logs_page_item_message">
                <div className="admin_panel_content_logs_page_item_message_icon">
                    <EditIcon/>
                </div>
                <p>Отредактировал пост</p>
            </div>
            <PostEntity id={log.data.post} data={posts.find(p => p._id === log.data.post)} setFilter={setFilter} />
        </>
    ),
    
    delete_post: ({ log, posts, setFilter }) => (
        <>
             <div className="admin_panel_content_logs_page_item_message">
                <div className="admin_panel_content_logs_page_item_message_icon">
                    <DeleteIcon/>
                </div>
                <p>Удалил пост</p>
            </div>
            <PostEntity id={log.data.post} data={posts.find(p => p._id === log.data.post)} setFilter={setFilter} />
        </>
    ),

    register: () => (
        <>
            <div className="admin_panel_content_logs_page_item_message">
                <div className="admin_panel_content_logs_page_item_message_icon">
                    <NewUserIcon/>
                </div>
                <p>Зарегестрировался</p>
            </div>
            <div className="admin_panel_content_logs_page_item_entity">
            </div>
        </>
    ),

    create_category: ({ log, categories, setFilter }) => (
        <>
            <div className="admin_panel_content_logs_page_item_message">
                <div className="admin_panel_content_logs_page_item_message_icon">
                    <PlusIcon/>
                </div>
                <p>Создал категорию</p>
            </div>
            <CategoryEntity id={log.data.category} data={categories.find(cat => cat._id === log.data.category)} setFilter={setFilter} />
        </>
    ),

    update_category: ({ log, categories, setFilter }) => (
        <>
            <div className="admin_panel_content_logs_page_item_message">
                <div className="admin_panel_content_logs_page_item_message_icon">
                    <EditIcon/>
                </div>
                <p>Отредактировал категорию</p>
            </div>
            <CategoryEntity id={log.data.category} data={categories.find(cat => cat._id === log.data.category)} setFilter={setFilter} />
        </>
    ),

    delete_category: ({ log, categories, setFilter }) => (
        <>
            <div className="admin_panel_content_logs_page_item_message">
                <div className="admin_panel_content_logs_page_item_message_icon">
                    <DeleteIcon/>
                </div>
                <p>Удалил категорию</p>
            </div>
            <CategoryEntity id={log.data.category} data={categories.find(cat => cat._id === log.data.category)} setFilter={setFilter} />
        </>
    ),

    update_role: ({ log, users, setFilter }) => (
        <>
            <div className="admin_panel_content_logs_page_item_message">
                <div className="admin_panel_content_logs_page_item_message_icon">
                    <EditIcon/>
                </div>
                <p>Изменил роль пользователя</p>
            </div>
            <UserEntity id={log.data.updated_user} data={users.find(u => u._id === log.data.updated_user)} setFilter={setFilter} />
            <RoleEntity id={log.data.new_role} data={ { role: log.data.new_role } } setFilter={setFilter} />
        </>
    ),

    create_support_request: ({ log, setFilter }) => (
        <>
            <div className="admin_panel_content_logs_page_item_message">
                <div className="admin_panel_content_logs_page_item_message_icon">
                    <PlusIcon/>
                </div>
                <p>
                    {log.data?.kind === "complaint"
                        ? "Оставил жалобу"
                        : log.data?.kind === "help"
                            ? "Запросил помощь"
                            : "Оставил запрос"}
                </p>
            </div>
            <SupportEntity
                id={log.data.support_request}
                accessKey={log.data.access_key}
                kind={log.data.kind}
                setFilter={setFilter}
            />
        </>
    ),

    reply_support_request: ({ log, setFilter }) => (
        <>
            <div className="admin_panel_content_logs_page_item_message">
                <div className="admin_panel_content_logs_page_item_message_icon">
                    <CommentIcon/>
                </div>
                <p>{log.data?.author_type === "requester" ? "Дополнил обращение" : "Ответил на обращение"}</p>
            </div>
            <SupportEntity
                id={log.data.support_request}
                accessKey={log.data.access_key}
                kind={log.data.kind}
                setFilter={setFilter}
            />
        </>
    ),

    update_support_status: ({ log, setFilter }) => (
        <>
            <div className="admin_panel_content_logs_page_item_message">
                <div className="admin_panel_content_logs_page_item_message_icon">
                    <EditIcon/>
                </div>
                <p>Сменил статус обращения</p>
            </div>
            <SupportEntity
                id={log.data.support_request}
                accessKey={log.data.access_key}
                kind={log.data.kind}
                setFilter={setFilter}
            />
            <SupportStatusEntity status={log.data.status} />
        </>
    )
};

const ACTIONS = {
    create_post: {
        title: "Создание поста",
        className: "create_post",
        icon: PlusIcon
    },

    update_post: {
        title: "Редактирование поста",
        className: "update_post",
        icon: EditIcon
    },

    delete_post: {
        title: "Удаление поста",
        className: "delete_post",
        icon: DeleteIcon
    },

    register: {
        title: "Регистрация",
        className: "register",
        icon: NewUserIcon
    },

    create_category: {
        title: "Создание категории",
        className: "create_category",
        icon: PlusIcon
    },
    
    update_category: {
        title: "Редактирование категории",
        className: "update_category",
        icon: EditIcon
    },

    delete_category: {
        title: "Удаление категории",
        className: "delete_category",
        icon: DeleteIcon
    },
    update_role: {
        title: "Role update",
        className: "update_role",
        icon: EditIcon
    },
    create_support_request: {
        title: "Обращение",
        className: "create_support_request",
        icon: PlusIcon
    },
    reply_support_request: {
        title: "Ответ на обращение",
        className: "reply_support_request",
        icon: CommentIcon
    },
    update_support_status: {
        title: "Статус обращения",
        className: "update_support_status",
        icon: EditIcon
    }
};


const LogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(1);
    const [pagesCount, setPagesCount] = useState(0);
    const [filter, setFilter] = useState({
        type: null,
        id: null
    });

    const { showToast } = useContext(AppContext);

    const applyFilter = (next) => {
        const type = next?.type ?? null;
        const id = next?.id ?? null;

        if (filter.type === type && filter.id === id) {
            return;
        }

        setFilter({ type, id });
        setPage(1);
    };

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            const logsQuery = {
                page,
                limit: 9
            };

            if (filter.type && filter.id && ["user", "post", "category", "support_request"].includes(filter.type)) {
                logsQuery[filter.type] = filter.id;
            }

            const [logsResult, categoriesResult] = await Promise.all([
                getAllLogs(logsQuery),
                getCategories()
            ]);

            if (cancelled) {
                return;
            }

            setCategories(categoriesResult?.data || []);

            if (!logsResult.status) {
                showToast({
                    type: "error",
                    message: logsResult.message
                });

                setLogs([]);
                setPagesCount(0);
                setLoading(false);
                return;
            }

            const items = logsResult.data?.items || [];
            setLogs(items);
            setPagesCount(logsResult.data?.pagination?.pages || 0);

            const postIds = [...new Set(items.map((log) => log.data?.post).filter(Boolean))];

            if (postIds.length) {
                const postsResult = await getPosts({
                    _id: postIds,
                    limit: Math.min(50, postIds.length)
                });
                if (!cancelled) {
                    setPosts(postsResult?.data?.items || []);
                }
            }
            else if (!cancelled) {
                setPosts([]);
            }

            if (!cancelled) {
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [page, filter.id, filter.type, showToast]);
    
    useEffect(() => {
        const fetchUsers = async () => {
            const userIds = [
                ...new Set(
                    logs
                        .flatMap(log => [log.data?.user, log.data?.updated_user])
                        .filter(Boolean)
                )
            ];
    
            const usersResult = await getUsers(
                userIds.map(_id => ({ _id }))
            )

            if(usersResult.status) {
                setUsers(usersResult.data);
            }
        } 

        fetchUsers();
    },[logs]);

    if (loading) {
        return (
            <Loading size={40} />
        );

    }

    const search_select_options = [];

    logs.forEach(log => {
        if (
            log.data?.user &&
            !search_select_options.some(
                option => 
                    option.value.type === "user" &&
                    option.value.value === log.data.user
            )
        ) {
            const user = users.find(u => u._id === log.data.user);

            search_select_options.push({
                value: {
                    type: "user",
                    value: log.data.user
                },
                name: user?.nick_name ?? log.data.user,
                _id: log.data.user,
                render: () => (
                    <UserEntity
                        id={log.data.user}
                        data={user}
                        setFilter={() => {}}
                    />
                )
            });
        }

        else if (
            log.data?.post &&
            !search_select_options.some(
                option =>
                    option.value.type === "post" &&
                    option.value.value === log.data.post
            )
        ) {
            const post = posts.find(p => p._id === log.data.post);

            search_select_options.push({
                value: {
                    type: "post",
                    value: log.data.post
                },
                name: post?.title ?? log.data.post,
                _id: log.data.post,
                render: () => (
                    <PostEntity
                        id={log.data.post}
                        data={post}
                        setFilter={() => {}}
                    />
                )
            });
        }
        else if(log.data?.category && !search_select_options.some(
            option =>
                option.value.type === "category" &&
                option.value.value === log.data.category
        )) {
            const category = categories.find(c => c._id === log.data.category);

            search_select_options.push({
                value: {
                    type: "category",
                    value: log.data.category
                },
                name: category?.name ?? log.data.category,
                _id: log.data.category,
                render: () => (
                    <CategoryEntity
                        id={log.data.category}
                        data={category}
                        setFilter={() => {}}
                    />
                )
            });
        }

        if (
            log.data?.support_request &&
            !search_select_options.some(
                option =>
                    option.value.type === "support_request" &&
                    option.value.value === log.data.support_request
            )
        ) {
            search_select_options.push({
                value: {
                    type: "support_request",
                    value: log.data.support_request
                },
                name: kindLabel(log.data.kind) || "Обращение",
                _id: log.data.support_request,
                render: () => (
                    <SupportEntity
                        id={log.data.support_request}
                        accessKey={log.data.access_key}
                        kind={log.data.kind}
                        setFilter={() => {}}
                    />
                )
            });
        }
    });

    return (
        <div className="admin_panel_content_logs_page">
            {
                filter.type ?
                    <div className="admin_panel_content_logs_page_filter">
                        <FilterIcon className="admin_panel_content_logs_page_filter_icon" />
                        {filter.type === "user" && <UserEntity id={filter.id} data={users.find(u => u._id === filter.id)} setFilter={applyFilter} />}
                        {filter.type === "post" && <PostEntity id={filter.id} data={posts.find(p => p._id === filter.id)} setFilter={applyFilter} />}
                        {filter.type === "category" && <CategoryEntity id={filter.id} data={categories.find(c => c._id === filter.id)} setFilter={applyFilter} />}
                        {filter.type === "support_request" && (
                            <SupportEntity
                                id={filter.id}
                                accessKey={logs.find((log) => log.data?.support_request === filter.id)?.data?.access_key}
                                kind={logs.find((log) => log.data?.support_request === filter.id)?.data?.kind}
                                setFilter={applyFilter}
                            />
                        )}
                        {filter.type === "role" && <RoleEntity id={filter.id} data={ { role: filter.id } } setFilter={applyFilter} />}
                        <CancelButton onClick={() => applyFilter({ type: null, id: null })}>Отмена</CancelButton>
                    </div>
                :
                    <SearchSelect options={search_select_options} onChange={(value) => {
                        if (!value?.type) {
                            return;
                        }
                        applyFilter({ type: value.type, id: value.value });
                    }}/>
            }
            {
                <Pagination
                    content={logs}
                    page={page - 1}
                    pagesCount={pagesCount}
                    onPageChange={(index) => setPage(index + 1)}
                >
                    {(visibleContent) => (
                        visibleContent.map(log => {
                            const Renderer = LOG_RENDERERS[log.type];
                            const action = ACTIONS[log.type];

                            return (
                                <LogLayout
                                    key={log._id}
                                    action={action}
                                    setFilter={applyFilter}
                                    user={users.find(user => user._id === log.data?.user)}
                                    log={log}
                                    time={log.date_time}
                                >
                                    {Renderer?.({
                                        log,
                                        users,
                                        posts,
                                        categories,
                                        setFilter: applyFilter
                                    })}
                                </LogLayout>
                            );
                        })
                    )}
                </Pagination>
            }
        </div>
    );

};

export default LogsPage;
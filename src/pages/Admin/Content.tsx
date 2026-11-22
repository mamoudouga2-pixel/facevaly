import {
    useCallback,
    useEffect,
    useState,
} from "react";

import AdminLayout from "./Layout";
import adminService from "../../services/adminService";

import {
    AdminBadge,
    AdminCard,
    AdminEmpty,
    AdminLoader,
    AdminModal,
    AdminPageHeader,
    AdminToast,
    firstError,
    formatDate,
} from "../../components/admin/AdminUI";

import {
    mediaUrl,
} from "../../config/api";

import "./admin.css";


const blankBlog = {
    blog_category_id: "",
    title: "",
    slug: "",
    short_description: "",
    description: "",
    status: "draft",
    published_at: "",
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
    image: null,
    remove_image: false,
};


export default function AdminContent() {
    const [
        data,
        setData,
    ] = useState({
        blogs: [],
        categories: [],
    });

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        modal,
        setModal,
    ] = useState(null);

    const [
        editId,
        setEditId,
    ] = useState(null);

    const [
        blog,
        setBlog,
    ] = useState(blankBlog);

    const [
        category,
        setCategory,
    ] = useState({
        name: "",
        slug: "",
        image: null,
    });

    const [
        toast,
        setToast,
    ] = useState(null);


    const notify = useCallback(
        (
            message,
            type = "success"
        ) => {
            setToast({
                message,
                type,
            });

            window.setTimeout(
                () => setToast(null),
                3200
            );
        },
        []
    );


    const load = useCallback(
        async () => {
            setLoading(true);

            try {
                const response =
                    await adminService
                        .content();

                setData(response.data || {});
            } catch (exception) {
                notify(
                    firstError(exception),
                    "error"
                );
            } finally {
                setLoading(false);
            }
        },
        [notify]
    );


    useEffect(() => {
        load();
    }, [load]);


    const openBlog = (
        row = null
    ) => {
        setEditId(row?.id || null);

        setBlog(
            row
                ? {
                    blog_category_id:
                        row.blog_category_id || "",
                    title:
                        row.title || "",
                    slug:
                        row.slug || "",
                    short_description:
                        row.short_description || "",
                    description:
                        row.description || "",
                    status:
                        row.status || "draft",
                    published_at:
                        row.published_at
                            ? String(row.published_at)
                                .slice(0, 16)
                            : "",
                    meta_title:
                        row.meta_title || "",
                    meta_description:
                        row.meta_description || "",
                    meta_keywords:
                        row.meta_keywords || "",
                    image:
                        null,
                    remove_image:
                        false,
                    existing_image:
                        row.image || null,
                }
                : blankBlog
        );

        setModal("blog");
    };


    const saveBlog = async () => {
        const form =
            new FormData();

        [
            "blog_category_id",
            "title",
            "slug",
            "short_description",
            "description",
            "status",
            "published_at",
            "meta_title",
            "meta_description",
            "meta_keywords",
        ].forEach(
            (key) =>
                form.append(
                    key,
                    blog[key] ?? ""
                )
        );

        form.append(
            "remove_image",
            blog.remove_image ? "1" : "0"
        );

        if (blog.image instanceof File) {
            form.append(
                "image",
                blog.image
            );
        }

        try {
            const response =
                await adminService
                    .saveBlog(
                        editId,
                        form
                    );

            notify(response.message);
            setModal(null);
            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        }
    };


    const deleteBlog = async (id) => {
        if (!window.confirm("Move this article to trash?")) {
            return;
        }

        try {
            const response =
                await adminService
                    .deleteBlog(id);

            notify(response.message);
            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        }
    };


    const restoreBlog = async (id) => {
        try {
            const response =
                await adminService
                    .restoreBlog(id);

            notify(response.message);
            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        }
    };


    const saveCategory = async () => {
        const form =
            new FormData();

        form.append(
            "name",
            category.name
        );

        form.append(
            "slug",
            category.slug || ""
        );

        if (category.image instanceof File) {
            form.append(
                "image",
                category.image
            );
        }

        try {
            const response =
                await adminService
                    .saveBlogCategory(
                        null,
                        form
                    );

            notify(response.message);

            setCategory({
                name: "",
                slug: "",
                image: null,
            });

            setModal(null);
            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        }
    };


    return (
        <AdminLayout>
            <AdminPageHeader
                title="Content & Blog"
                description="Manage platform articles, buying guides, marketplace news and SEO metadata."
                actions={
                    <>
                        <button
                            className="adm-btn"
                            type="button"
                            onClick={() =>
                                setModal("category")
                            }
                        >
                            <i className="fa-solid fa-folder-plus" />
                            Blog Category
                        </button>

                        <button
                            className="adm-btn adm-btn-primary"
                            type="button"
                            onClick={() => openBlog()}
                        >
                            <i className="fa-solid fa-plus" />
                            New Article
                        </button>
                    </>
                }
            />

            <AdminCard title="Platform Articles">
                {loading ? (
                    <AdminLoader />
                ) : !data.blogs?.length ? (
                    <AdminEmpty
                        title="No articles found"
                    />
                ) : (
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Article</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Published</th>
                                    <th>Author</th>
                                    <th />
                                </tr>
                            </thead>

                            <tbody>
                                {data.blogs.map((row) => (
                                    <tr key={row.id}>
                                        <td data-label="Article">
                                            <div className="adm-product-cell">
                                                <span className="adm-thumb">
                                                    {row.image ? (
                                                        <img
                                                            src={mediaUrl(row.image)}
                                                            alt={row.title}
                                                        />
                                                    ) : (
                                                        <i className="fa-regular fa-newspaper" />
                                                    )}
                                                </span>

                                                <div>
                                                    <strong>
                                                        {row.title}
                                                    </strong>

                                                    <span className="adm-table-sub">
                                                        {row.slug}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td data-label="Category">
                                            {row.category || "—"}
                                        </td>

                                        <td data-label="Status">
                                            <AdminBadge
                                                value={
                                                    row.deleted_at
                                                        ? "deleted"
                                                        : row.status
                                                }
                                            />
                                        </td>

                                        <td data-label="Published">
                                            {formatDate(row.published_at)}
                                        </td>

                                        <td data-label="Author">
                                            {row.author || "—"}
                                        </td>

                                        <td data-label="Action">
                                            <div className="adm-table-actions">
                                                {row.deleted_at ? (
                                                    <button
                                                        className="adm-btn"
                                                        type="button"
                                                        onClick={() =>
                                                            restoreBlog(row.id)
                                                        }
                                                    >
                                                        Restore
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="adm-btn"
                                                            type="button"
                                                            onClick={() =>
                                                                openBlog(row)
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            className="adm-btn adm-btn-danger"
                                                            type="button"
                                                            onClick={() =>
                                                                deleteBlog(row.id)
                                                            }
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminCard>

            <AdminCard title="Blog Categories">
                {!data.categories?.length ? (
                    <AdminEmpty
                        title="No blog categories"
                    />
                ) : (
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Articles</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.categories.map((row) => (
                                    <tr key={row.id}>
                                        <td data-label="Category">
                                            <strong>
                                                {row.name}
                                            </strong>

                                            <span className="adm-table-sub">
                                                {row.slug}
                                            </span>
                                        </td>

                                        <td data-label="Articles">
                                            {row.blogs_count || 0}
                                        </td>

                                        <td data-label="Status">
                                            <AdminBadge
                                                value={
                                                    row.deleted_at
                                                        ? "deleted"
                                                        : "active"
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminCard>

            <AdminModal
                open={modal === "blog"}
                title={
                    editId
                        ? "Edit Article"
                        : "Create Article"
                }
                size="xl"
                onClose={() => setModal(null)}
            >
                <div className="adm-form-grid">
                    <label className="adm-field">
                        <span>Title</span>

                        <input
                            className="adm-input"
                            value={blog.title}
                            onChange={(event) =>
                                setBlog((current) => ({
                                    ...current,
                                    title: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="adm-field">
                        <span>Slug</span>

                        <input
                            className="adm-input"
                            value={blog.slug}
                            onChange={(event) =>
                                setBlog((current) => ({
                                    ...current,
                                    slug: event.target.value,
                                }))
                            }
                            placeholder="Auto generated if blank"
                        />
                    </label>

                    <label className="adm-field">
                        <span>Category</span>

                        <select
                            className="adm-select"
                            value={blog.blog_category_id}
                            onChange={(event) =>
                                setBlog((current) => ({
                                    ...current,
                                    blog_category_id: event.target.value,
                                }))
                            }
                        >
                            <option value="">
                                No Category
                            </option>

                            {data.categories
                                ?.filter((row) => !row.deleted_at)
                                .map((row) => (
                                    <option
                                        key={row.id}
                                        value={row.id}
                                    >
                                        {row.name}
                                    </option>
                                ))}
                        </select>
                    </label>

                    <label className="adm-field">
                        <span>Status</span>

                        <select
                            className="adm-select"
                            value={blog.status}
                            onChange={(event) =>
                                setBlog((current) => ({
                                    ...current,
                                    status: event.target.value,
                                }))
                            }
                        >
                            <option value="draft">
                                Draft
                            </option>
                            <option value="published">
                                Published
                            </option>
                        </select>
                    </label>

                    <label className="adm-field">
                        <span>Publish At</span>

                        <input
                            className="adm-input"
                            type="datetime-local"
                            value={blog.published_at}
                            onChange={(event) =>
                                setBlog((current) => ({
                                    ...current,
                                    published_at: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="adm-field">
                        <span>Image</span>

                        <input
                            className="adm-input"
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                                setBlog((current) => ({
                                    ...current,
                                    image:
                                        event.target.files?.[0]
                                        || null,
                                }))
                            }
                        />
                    </label>

                    <label className="adm-field full">
                        <span>Short Description</span>

                        <textarea
                            className="adm-textarea"
                            value={blog.short_description}
                            onChange={(event) =>
                                setBlog((current) => ({
                                    ...current,
                                    short_description: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="adm-field full">
                        <span>Article Content</span>

                        <textarea
                            className="adm-textarea"
                            style={{
                                minHeight: 260,
                            }}
                            value={blog.description}
                            onChange={(event) =>
                                setBlog((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="adm-field full">
                        <span>Meta Title</span>

                        <input
                            className="adm-input"
                            value={blog.meta_title}
                            onChange={(event) =>
                                setBlog((current) => ({
                                    ...current,
                                    meta_title: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="adm-field full">
                        <span>Meta Description</span>

                        <textarea
                            className="adm-textarea"
                            value={blog.meta_description}
                            onChange={(event) =>
                                setBlog((current) => ({
                                    ...current,
                                    meta_description: event.target.value,
                                }))
                            }
                        />
                    </label>

                    {blog.existing_image && (
                        <label className="adm-check full">
                            <input
                                type="checkbox"
                                checked={blog.remove_image}
                                onChange={(event) =>
                                    setBlog((current) => ({
                                        ...current,
                                        remove_image: event.target.checked,
                                    }))
                                }
                            />
                            Remove current image
                        </label>
                    )}
                </div>

                <div className="adm-modal-footer">
                    <button
                        className="adm-btn adm-btn-primary"
                        type="button"
                        onClick={saveBlog}
                    >
                        Save Article
                    </button>
                </div>
            </AdminModal>

            <AdminModal
                open={modal === "category"}
                title="Create Blog Category"
                size="small"
                onClose={() => setModal(null)}
            >
                <div className="adm-form-grid">
                    <label className="adm-field full">
                        <span>Name</span>

                        <input
                            className="adm-input"
                            value={category.name}
                            onChange={(event) =>
                                setCategory((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="adm-field full">
                        <span>Slug</span>

                        <input
                            className="adm-input"
                            value={category.slug}
                            onChange={(event) =>
                                setCategory((current) => ({
                                    ...current,
                                    slug: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="adm-field full">
                        <span>Image</span>

                        <input
                            className="adm-input"
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                                setCategory((current) => ({
                                    ...current,
                                    image:
                                        event.target.files?.[0]
                                        || null,
                                }))
                            }
                        />
                    </label>
                </div>

                <div className="adm-modal-footer">
                    <button
                        className="adm-btn adm-btn-primary"
                        type="button"
                        onClick={saveCategory}
                    >
                        Save Category
                    </button>
                </div>
            </AdminModal>

            <AdminToast toast={toast} />
        </AdminLayout>
    );
}

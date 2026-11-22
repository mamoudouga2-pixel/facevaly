import {
    useCallback,
    useEffect,
    useMemo,
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
} from "../../components/admin/AdminUI";

import {
    mediaUrl,
} from "../../config/api";

import "./admin.css";


const blankCategory = {
    parent_id: "",
    name: "",
    slug: "",
    meta_title: "",
    meta_keywords: "",
    meta_description: "",
    sort_order: 0,
    is_featured: false,
    is_active: true,
    category_image: null,
    banner_image: null,
    remove_category_image: false,
    remove_banner_image: false,
};


const blankBrand = {
    name: "",
    slug: "",
    description: "",
    meta_title: "",
    meta_keywords: "",
    meta_description: "",
    sort_order: 0,
    is_featured: false,
    is_active: true,
    logo: null,
    remove_logo: false,
};


export default function AdminCatalog() {
    const [
        activeTab,
        setActiveTab,
    ] =
        useState(
            "categories"
        );

    const [
        categories,
        setCategories,
    ] =
        useState([]);

    const [
        brands,
        setBrands,
    ] =
        useState([]);

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        modalOpen,
        setModalOpen,
    ] =
        useState(false);

    const [
        editId,
        setEditId,
    ] =
        useState(null);

    const [
        categoryForm,
        setCategoryForm,
    ] =
        useState(
            blankCategory
        );

    const [
        brandForm,
        setBrandForm,
    ] =
        useState(
            blankBrand
        );

    const [
        saving,
        setSaving,
    ] =
        useState(false);

    const [
        toast,
        setToast,
    ] =
        useState(null);


    const notify =
        useCallback(
            (
                message,
                type = "success"
            ) => {
                setToast({
                    message,
                    type,
                });

                window.setTimeout(
                    () =>
                        setToast(
                            null
                        ),
                    3200
                );
            },
            []
        );


    const load =
        useCallback(
            async () => {
                setLoading(
                    true
                );

                try {
                    const [
                        categoryResponse,
                        brandResponse,
                    ] =
                        await Promise.all([
                            adminService
                                .categories(),
                            adminService
                                .brands(),
                        ]);

                    setCategories(
                        categoryResponse.data ||
                        []
                    );

                    setBrands(
                        brandResponse.data ||
                        []
                    );
                } catch (
                    exception
                ) {
                    notify(
                        firstError(
                            exception
                        ),
                        "error"
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            [
                notify,
            ]
        );


    useEffect(
        () => {
            load();
        },
        [
            load,
        ]
    );


    const parentOptions =
        useMemo(
            () =>
                categories.filter(
                    (
                        row
                    ) =>
                        !row.deleted_at
                        && row.id !==
                            editId
                ),
            [
                categories,
                editId,
            ]
        );


    const openCategory =
        (
            row = null
        ) => {
            setActiveTab(
                "categories"
            );

            setEditId(
                row?.id ||
                null
            );

            setCategoryForm(
                row
                    ? {
                        parent_id:
                            row.parent_id ||
                            "",
                        name:
                            row.name ||
                            "",
                        slug:
                            row.slug ||
                            "",
                        meta_title:
                            row.meta_title ||
                            "",
                        meta_keywords:
                            row.meta_keywords ||
                            "",
                        meta_description:
                            row.meta_description ||
                            "",
                        sort_order:
                            row.sort_order ||
                            0,
                        is_featured:
                            Boolean(
                                row.is_featured
                            ),
                        is_active:
                            Boolean(
                                row.is_active
                            ),
                        category_image:
                            null,
                        banner_image:
                            null,
                        remove_category_image:
                            false,
                        remove_banner_image:
                            false,
                        existing_category_image:
                            row.category_image ||
                            null,
                        existing_banner_image:
                            row.banner_image ||
                            null,
                    }
                    : blankCategory
            );

            setModalOpen(
                true
            );
        };


    const openBrand =
        (
            row = null
        ) => {
            setActiveTab(
                "brands"
            );

            setEditId(
                row?.id ||
                null
            );

            setBrandForm(
                row
                    ? {
                        name:
                            row.name ||
                            "",
                        slug:
                            row.slug ||
                            "",
                        description:
                            row.description ||
                            "",
                        meta_title:
                            row.meta_title ||
                            "",
                        meta_keywords:
                            row.meta_keywords ||
                            "",
                        meta_description:
                            row.meta_description ||
                            "",
                        sort_order:
                            row.sort_order ||
                            0,
                        is_featured:
                            Boolean(
                                row.is_featured
                            ),
                        is_active:
                            Boolean(
                                row.is_active
                            ),
                        logo:
                            null,
                        remove_logo:
                            false,
                        existing_logo:
                            row.logo ||
                            null,
                    }
                    : blankBrand
            );

            setModalOpen(
                true
            );
        };


    const categoryFormData =
        () => {
            const data =
                new FormData();

            Object.entries(
                categoryForm
            ).forEach(
                ([
                    key,
                    value,
                ]) => {
                    if (
                        key.startsWith(
                            "existing_"
                        )
                    ) {
                        return;
                    }

                    if (
                        key ===
                            "category_image"
                        || key ===
                            "banner_image"
                    ) {
                        if (
                            value instanceof
                            File
                        ) {
                            data.append(
                                key,
                                value
                            );
                        }

                        return;
                    }

                    if (
                        [
                            "is_featured",
                            "is_active",
                            "remove_category_image",
                            "remove_banner_image",
                        ].includes(
                            key
                        )
                    ) {
                        data.append(
                            key,
                            value
                                ? "1"
                                : "0"
                        );

                        return;
                    }

                    data.append(
                        key,
                        value ??
                        ""
                    );
                }
            );

            return data;
        };


    const brandFormData =
        () => {
            const data =
                new FormData();

            Object.entries(
                brandForm
            ).forEach(
                ([
                    key,
                    value,
                ]) => {
                    if (
                        key.startsWith(
                            "existing_"
                        )
                    ) {
                        return;
                    }

                    if (
                        key ===
                        "logo"
                    ) {
                        if (
                            value instanceof
                            File
                        ) {
                            data.append(
                                key,
                                value
                            );
                        }

                        return;
                    }

                    if (
                        [
                            "is_featured",
                            "is_active",
                            "remove_logo",
                        ].includes(
                            key
                        )
                    ) {
                        data.append(
                            key,
                            value
                                ? "1"
                                : "0"
                        );

                        return;
                    }

                    data.append(
                        key,
                        value ??
                        ""
                    );
                }
            );

            return data;
        };


    const save =
        async () => {
            setSaving(
                true
            );

            try {
                const response =
                    activeTab ===
                    "categories"
                        ? await adminService
                            .saveCategory(
                                editId,
                                categoryFormData()
                            )
                        : await adminService
                            .saveBrand(
                                editId,
                                brandFormData()
                            );

                notify(
                    response.message
                );

                setModalOpen(
                    false
                );

                await load();
            } catch (
                exception
            ) {
                notify(
                    firstError(
                        exception
                    ),
                    "error"
                );
            } finally {
                setSaving(
                    false
                );
            }
        };


    const remove =
        async (
            type,
            id
        ) => {
            if (
                !window.confirm(
                    `Move this ${type} to trash?`
                )
            ) {
                return;
            }

            try {
                const response =
                    type ===
                    "category"
                        ? await adminService
                            .deleteCategory(
                                id
                            )
                        : await adminService
                            .deleteBrand(
                                id
                            );

                notify(
                    response.message
                );

                await load();
            } catch (
                exception
            ) {
                notify(
                    firstError(
                        exception
                    ),
                    "error"
                );
            }
        };


    const restore =
        async (
            type,
            id
        ) => {
            try {
                const response =
                    type ===
                    "category"
                        ? await adminService
                            .restoreCategory(
                                id
                            )
                        : await adminService
                            .restoreBrand(
                                id
                            );

                notify(
                    response.message
                );

                await load();
            } catch (
                exception
            ) {
                notify(
                    firstError(
                        exception
                    ),
                    "error"
                );
            }
        };


    return (
        <AdminLayout>
            <AdminPageHeader
                title="Catalog Management"
                description="Manage marketplace categories and brands used by seller products and storefront discovery."
                actions={
                    <button
                        type="button"
                        className="adm-btn adm-btn-primary"
                        onClick={() =>
                            activeTab ===
                            "categories"
                                ? openCategory()
                                : openBrand()
                        }
                    >
                        <i className="fa-solid fa-plus" />
                        Add{" "}
                        {
                            activeTab ===
                            "categories"
                                ? "Category"
                                : "Brand"
                        }
                    </button>
                }
            />

            <div className="adm-tabs">
                <button
                    type="button"
                    className={
                        activeTab ===
                        "categories"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab(
                            "categories"
                        )
                    }
                >
                    Categories
                </button>

                <button
                    type="button"
                    className={
                        activeTab ===
                        "brands"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab(
                            "brands"
                        )
                    }
                >
                    Brands
                </button>
            </div>

            <div
                style={{
                    height:
                        10,
                }}
            />

            <AdminCard>
                {loading ? (
                    <AdminLoader />
                ) : activeTab ===
                    "categories" ? (
                    !categories.length ? (
                        <AdminEmpty
                            title="No categories found"
                        />
                    ) : (
                        <div className="adm-table-wrap">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Category
                                        </th>
                                        <th>
                                            Parent
                                        </th>
                                        <th>
                                            Products
                                        </th>
                                        <th>
                                            Featured
                                        </th>
                                        <th>
                                            Active
                                        </th>
                                        <th>
                                            Sort
                                        </th>
                                        <th />
                                    </tr>
                                </thead>

                                <tbody>
                                    {categories.map(
                                        (
                                            row
                                        ) => (
                                            <tr
                                                key={
                                                    row.id
                                                }
                                            >
                                                <td
                                                    data-label="Category"
                                                >
                                                    <div className="adm-product-cell">
                                                        <span className="adm-thumb">
                                                            {row.category_image ? (
                                                                <img
                                                                    src={
                                                                        mediaUrl(
                                                                            row.category_image
                                                                        )
                                                                    }
                                                                    alt={
                                                                        row.name
                                                                    }
                                                                />
                                                            ) : (
                                                                <i className="fa-solid fa-folder-tree" />
                                                            )}
                                                        </span>

                                                        <div>
                                                            <strong>
                                                                {
                                                                    row.name
                                                                }
                                                            </strong>

                                                            <span className="adm-table-sub">
                                                                {
                                                                    row.slug
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td
                                                    data-label="Parent"
                                                >
                                                    {
                                                        row.parent_name ||
                                                        "Root"
                                                    }
                                                </td>

                                                <td
                                                    data-label="Products"
                                                >
                                                    {
                                                        row.products_count
                                                    }
                                                </td>

                                                <td
                                                    data-label="Featured"
                                                >
                                                    <AdminBadge
                                                        value={
                                                            row.is_featured
                                                                ? "active"
                                                                : "inactive"
                                                        }
                                                    />
                                                </td>

                                                <td
                                                    data-label="Active"
                                                >
                                                    <AdminBadge
                                                        value={
                                                            row.is_active
                                                                ? "active"
                                                                : "inactive"
                                                        }
                                                    />
                                                </td>

                                                <td
                                                    data-label="Sort"
                                                >
                                                    {
                                                        row.sort_order
                                                    }
                                                </td>

                                                <td
                                                    data-label="Action"
                                                >
                                                    <div className="adm-table-actions">
                                                        {row.deleted_at ? (
                                                            <button
                                                                className="adm-btn"
                                                                onClick={() =>
                                                                    restore(
                                                                        "category",
                                                                        row.id
                                                                    )
                                                                }
                                                            >
                                                                Restore
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    className="adm-btn"
                                                                    onClick={() =>
                                                                        openCategory(
                                                                            row
                                                                        )
                                                                    }
                                                                >
                                                                    Edit
                                                                </button>

                                                                <button
                                                                    className="adm-btn adm-btn-danger"
                                                                    onClick={() =>
                                                                        remove(
                                                                            "category",
                                                                            row.id
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : !brands.length ? (
                    <AdminEmpty
                        title="No brands found"
                    />
                ) : (
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>
                                        Brand
                                    </th>
                                    <th>
                                        Products
                                    </th>
                                    <th>
                                        Featured
                                    </th>
                                    <th>
                                        Active
                                    </th>
                                    <th>
                                        Sort
                                    </th>
                                    <th />
                                </tr>
                            </thead>

                            <tbody>
                                {brands.map(
                                    (
                                        row
                                    ) => (
                                        <tr
                                            key={
                                                row.id
                                            }
                                        >
                                            <td
                                                data-label="Brand"
                                            >
                                                <div className="adm-product-cell">
                                                    <span className="adm-thumb">
                                                        {row.logo ? (
                                                            <img
                                                                src={
                                                                    mediaUrl(
                                                                        row.logo
                                                                    )
                                                                }
                                                                alt={
                                                                    row.name
                                                                }
                                                            />
                                                        ) : (
                                                            <i className="fa-solid fa-copyright" />
                                                        )}
                                                    </span>

                                                    <div>
                                                        <strong>
                                                            {
                                                                row.name
                                                            }
                                                        </strong>

                                                        <span className="adm-table-sub">
                                                            {
                                                                row.slug
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td
                                                data-label="Products"
                                            >
                                                {
                                                    row.products_count
                                                }
                                            </td>

                                            <td
                                                data-label="Featured"
                                            >
                                                <AdminBadge
                                                    value={
                                                        row.is_featured
                                                            ? "active"
                                                            : "inactive"
                                                    }
                                                />
                                            </td>

                                            <td
                                                data-label="Active"
                                            >
                                                <AdminBadge
                                                    value={
                                                        row.is_active
                                                            ? "active"
                                                            : "inactive"
                                                    }
                                                />
                                            </td>

                                            <td
                                                data-label="Sort"
                                            >
                                                {
                                                    row.sort_order
                                                }
                                            </td>

                                            <td
                                                data-label="Action"
                                            >
                                                <div className="adm-table-actions">
                                                    {row.deleted_at ? (
                                                        <button
                                                            className="adm-btn"
                                                            onClick={() =>
                                                                restore(
                                                                    "brand",
                                                                    row.id
                                                                )
                                                            }
                                                        >
                                                            Restore
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className="adm-btn"
                                                                onClick={() =>
                                                                    openBrand(
                                                                        row
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                className="adm-btn adm-btn-danger"
                                                                onClick={() =>
                                                                    remove(
                                                                        "brand",
                                                                        row.id
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminCard>

            <AdminModal
                open={
                    modalOpen
                }
                title={
                    `${editId ? "Edit" : "Add"} ${
                        activeTab ===
                        "categories"
                            ? "Category"
                            : "Brand"
                    }`
                }
                size="large"
                onClose={() =>
                    setModalOpen(
                        false
                    )
                }
            >
                {activeTab ===
                    "categories" ? (
                    <div className="adm-form-grid">
                        <label className="adm-field">
                            <span>
                                Category Name
                            </span>
                            <input
                                className="adm-input"
                                value={
                                    categoryForm.name
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCategoryForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            name:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            />
                        </label>

                        <label className="adm-field">
                            <span>
                                Parent
                            </span>
                            <select
                                className="adm-select"
                                value={
                                    categoryForm.parent_id
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCategoryForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            parent_id:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            >
                                <option value="">
                                    Root Category
                                </option>

                                {parentOptions.map(
                                    (
                                        row
                                    ) => (
                                        <option
                                            key={
                                                row.id
                                            }
                                            value={
                                                row.id
                                            }
                                        >
                                            {
                                                row.name
                                            }
                                        </option>
                                    )
                                )}
                            </select>
                        </label>

                        <label className="adm-field">
                            <span>
                                Slug
                            </span>
                            <input
                                className="adm-input"
                                value={
                                    categoryForm.slug
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCategoryForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            slug:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                                placeholder="Auto generated if blank"
                            />
                        </label>

                        <label className="adm-field">
                            <span>
                                Sort Order
                            </span>
                            <input
                                className="adm-input"
                                type="number"
                                min="0"
                                value={
                                    categoryForm.sort_order
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCategoryForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            sort_order:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            />
                        </label>

                        <label className="adm-field">
                            <span>
                                Category Image
                            </span>
                            <input
                                className="adm-input"
                                type="file"
                                accept="image/*"
                                onChange={(
                                    event
                                ) =>
                                    setCategoryForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            category_image:
                                                event
                                                    .target
                                                    .files?.[
                                                    0
                                                ] ||
                                                null,
                                        })
                                    )
                                }
                            />
                        </label>

                        <label className="adm-field">
                            <span>
                                Banner Image
                            </span>
                            <input
                                className="adm-input"
                                type="file"
                                accept="image/*"
                                onChange={(
                                    event
                                ) =>
                                    setCategoryForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            banner_image:
                                                event
                                                    .target
                                                    .files?.[
                                                    0
                                                ] ||
                                                null,
                                        })
                                    )
                                }
                            />
                        </label>

                        <label className="adm-check">
                            <input
                                type="checkbox"
                                checked={
                                    categoryForm.is_featured
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCategoryForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            is_featured:
                                                event
                                                    .target
                                                    .checked,
                                        })
                                    )
                                }
                            />
                            Featured
                        </label>

                        <label className="adm-check">
                            <input
                                type="checkbox"
                                checked={
                                    categoryForm.is_active
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCategoryForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            is_active:
                                                event
                                                    .target
                                                    .checked,
                                        })
                                    )
                                }
                            />
                            Active
                        </label>

                        <label className="adm-field full">
                            <span>
                                Meta Title
                            </span>
                            <input
                                className="adm-input"
                                value={
                                    categoryForm.meta_title
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCategoryForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            meta_title:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            />
                        </label>

                        <label className="adm-field full">
                            <span>
                                Meta Description
                            </span>
                            <textarea
                                className="adm-textarea"
                                value={
                                    categoryForm.meta_description
                                }
                                onChange={(
                                    event
                                ) =>
                                    setCategoryForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            meta_description:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            />
                        </label>

                        {categoryForm
                            .existing_category_image && (
                            <label className="adm-check full">
                                <input
                                    type="checkbox"
                                    checked={
                                        categoryForm.remove_category_image
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setCategoryForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,
                                                remove_category_image:
                                                    event
                                                        .target
                                                        .checked,
                                            })
                                        )
                                    }
                                />
                                Remove current category image
                            </label>
                        )}

                        {categoryForm
                            .existing_banner_image && (
                            <label className="adm-check full">
                                <input
                                    type="checkbox"
                                    checked={
                                        categoryForm.remove_banner_image
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setCategoryForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,
                                                remove_banner_image:
                                                    event
                                                        .target
                                                        .checked,
                                            })
                                        )
                                    }
                                />
                                Remove current banner
                            </label>
                        )}
                    </div>
                ) : (
                    <div className="adm-form-grid">
                        <label className="adm-field">
                            <span>
                                Brand Name
                            </span>
                            <input
                                className="adm-input"
                                value={
                                    brandForm.name
                                }
                                onChange={(
                                    event
                                ) =>
                                    setBrandForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            name:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            />
                        </label>

                        <label className="adm-field">
                            <span>
                                Slug
                            </span>
                            <input
                                className="adm-input"
                                value={
                                    brandForm.slug
                                }
                                onChange={(
                                    event
                                ) =>
                                    setBrandForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            slug:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                                placeholder="Auto generated if blank"
                            />
                        </label>

                        <label className="adm-field">
                            <span>
                                Sort Order
                            </span>
                            <input
                                className="adm-input"
                                type="number"
                                min="0"
                                value={
                                    brandForm.sort_order
                                }
                                onChange={(
                                    event
                                ) =>
                                    setBrandForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            sort_order:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            />
                        </label>

                        <label className="adm-field">
                            <span>
                                Logo
                            </span>
                            <input
                                className="adm-input"
                                type="file"
                                accept="image/*"
                                onChange={(
                                    event
                                ) =>
                                    setBrandForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            logo:
                                                event
                                                    .target
                                                    .files?.[
                                                    0
                                                ] ||
                                                null,
                                        })
                                    )
                                }
                            />
                        </label>

                        <label className="adm-check">
                            <input
                                type="checkbox"
                                checked={
                                    brandForm.is_featured
                                }
                                onChange={(
                                    event
                                ) =>
                                    setBrandForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            is_featured:
                                                event
                                                    .target
                                                    .checked,
                                        })
                                    )
                                }
                            />
                            Featured
                        </label>

                        <label className="adm-check">
                            <input
                                type="checkbox"
                                checked={
                                    brandForm.is_active
                                }
                                onChange={(
                                    event
                                ) =>
                                    setBrandForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            is_active:
                                                event
                                                    .target
                                                    .checked,
                                        })
                                    )
                                }
                            />
                            Active
                        </label>

                        <label className="adm-field full">
                            <span>
                                Description
                            </span>
                            <textarea
                                className="adm-textarea"
                                value={
                                    brandForm.description
                                }
                                onChange={(
                                    event
                                ) =>
                                    setBrandForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            description:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            />
                        </label>

                        <label className="adm-field full">
                            <span>
                                Meta Title
                            </span>
                            <input
                                className="adm-input"
                                value={
                                    brandForm.meta_title
                                }
                                onChange={(
                                    event
                                ) =>
                                    setBrandForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            meta_title:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            />
                        </label>

                        <label className="adm-field full">
                            <span>
                                Meta Description
                            </span>
                            <textarea
                                className="adm-textarea"
                                value={
                                    brandForm.meta_description
                                }
                                onChange={(
                                    event
                                ) =>
                                    setBrandForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            meta_description:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            />
                        </label>

                        {brandForm
                            .existing_logo && (
                            <label className="adm-check full">
                                <input
                                    type="checkbox"
                                    checked={
                                        brandForm.remove_logo
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setBrandForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,
                                                remove_logo:
                                                    event
                                                        .target
                                                        .checked,
                                            })
                                        )
                                    }
                                />
                                Remove current logo
                            </label>
                        )}
                    </div>
                )}

                <div className="adm-modal-footer">
                    <button
                        className="adm-btn"
                        onClick={() =>
                            setModalOpen(
                                false
                            )
                        }
                    >
                        Cancel
                    </button>

                    <button
                        className="adm-btn adm-btn-primary"
                        disabled={
                            saving
                        }
                        onClick={
                            save
                        }
                    >
                        {
                            saving
                                ? "Saving..."
                                : "Save"
                        }
                    </button>
                </div>
            </AdminModal>

            <AdminToast
                toast={
                    toast
                }
            />
        </AdminLayout>
    );
}

import {
    adminQueryString,
    adminRequest,
} from "./adminService";
import {
    API_BASE_URL,
} from "../config/api";


const adminSellerService = {

    /* =====================================================
       LIST
    ===================================================== */

    list(
        filters: any = {}
    ): Promise<any> {
        const query =
            adminQueryString(
                filters
            );

        return adminRequest(
            query
                ? `admin/sellers?${query}`
                : "admin/sellers"
        );
    },


    /* =====================================================
       DETAILS
    ===================================================== */

    show(
        id: any
    ): Promise<any> {
        return adminRequest(
            `admin/sellers/${id}`
        );
    },


    /* =====================================================
       SINGLE STATUS
    ===================================================== */

    status(
        id: any,
        payload: any
    ): Promise<any> {
        return adminRequest(
            `admin/sellers/${id}/status`,
            {
                method:
                    "POST",

                body:
                    JSON.stringify(
                        payload
                    ),
            }
        );
    },


    /* =====================================================
       BULK
    ===================================================== */

    bulk(
        payload: any
    ): Promise<any> {
        return adminRequest(
            "admin/sellers/bulk",
            {
                method:
                    "POST",

                body:
                    JSON.stringify(
                        payload
                    ),
            }
        );
    },


    /* =====================================================
       DELETE
    ===================================================== */

    destroy(
        id: any
    ): Promise<any> {
        return adminRequest(
            `admin/sellers/${id}`,
            {
                method:
                    "DELETE",
            }
        );
    },


    /* =====================================================
       PERMANENT DELETE
    ===================================================== */

    forceDestroy(
        id: any
    ): Promise<any> {
        return adminRequest(
            `admin/sellers/${id}/force`,
            {
                method:
                    "DELETE",
            }
        );
    },


    /* =====================================================
       RESTORE
    ===================================================== */

    restore(
        id: any
    ): Promise<any> {
        return adminRequest(
            `admin/sellers/${id}/restore`,
            {
                method:
                    "POST",

                body:
                    JSON.stringify({}),
            }
        );
    },


    /* =====================================================
       COMMERCIAL
    ===================================================== */

    commercial(
        id: any,
        payload: any
    ): Promise<any> {
        return adminRequest(
            `admin/sellers/${id}/commercial`,
            {
                method:
                    "PUT",

                body:
                    JSON.stringify(
                        payload
                    ),
            }
        );
    },


    /* =====================================================
       DOCUMENT
    ===================================================== */

    documentFileUrl(id: any, download = false): string {
        const base = `${API_BASE_URL.replace(/\/+$/, "")}/admin/seller-documents/${id}/file`;
        return download ? `${base}?download=1` : base;
    },

    async fetchDocumentBlob(id: any, download = false): Promise<Blob> {
        const response = await fetch(this.documentFileUrl(id, download), {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "image/*,application/octet-stream,*/*",
                "X-Requested-With": "XMLHttpRequest",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            const error: any = new Error(
                response.status === 404
                    ? "Document file is missing on the server."
                    : "Unable to load document."
            );
            error.response = { status: response.status };
            throw error;
        }

        return response.blob();
    },

    async downloadDocumentFile(document: any): Promise<void> {
        const blob = await this.fetchDocumentBlob(document.id, true);
        const filename =
            String(document.file_path || "")
                .split("/")
                .pop()
            || `${document.type || "document"}-${document.id}`;

        const objectUrl = URL.createObjectURL(blob);
        const link = window.document.createElement("a");
        link.href = objectUrl;
        link.download = filename;
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    },

    verifyDocument(
        id: any,
        payload: any
    ): Promise<any> {
        return adminRequest(
            `admin/seller-documents/${id}/verify`,
            {
                method:
                    "POST",

                body:
                    JSON.stringify(
                        payload
                    ),
            }
        );
    },


    /* =====================================================
       BANK
    ===================================================== */

    verifyBank(
        id: any,
        isVerified: any
    ): Promise<any> {
        return adminRequest(
            `admin/seller-bank-accounts/${id}/verify`,
            {
                method:
                    "POST",

                body:
                    JSON.stringify({
                        is_verified:
                            isVerified,
                    }),
            }
        );
    },
};


export default adminSellerService;

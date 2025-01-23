import { APISERVICE } from "services/restApiClient";

//get all stores wrt tenant in mysql _ (s_tenant_store)
export const getAllWhatsappAccounts = () => {
    return new Promise((res, rej) => {
        APISERVICE.GET(`${process.env.REACT_APP_BASE_PCS_URL}/whatsapp/getAccounts/`).then((response) => {
            if (response) res(response.data);
            else res([])
            // console.log("response", response);
        }).catch(function (error) {
            rej(error);
            console.log("error", error);
        });
    })
}


//get all stores wrt tenant in mysql _ (s_tenant_store)
export const getWhatsappClientById = (tenantId, storeId) => {
    return new Promise((res, rej) => {
        APISERVICE.GET(`${process.env.REACT_APP_BASE_PCS_URL}/whatsapp/getAccounts?storeId=${storeId}&tenantId=${tenantId}`).then((response) => {
            if (response) res(response.data);
            else res([])
            // console.log("response", response);
        }).catch(function (error) {
            rej(error);
            console.log("error", error);
        });
    })
}

//get all stores wrt tenant in mysql _ (s_tenant_store)
export const getRechargeHistoryById = (accountId = null, tenantId = null, storeId = null) => {
    return new Promise((res, rej) => {
        let urlQuery = '';
        urlQuery += accountId ? `accountId=${accountId}` : '';
        urlQuery += storeId ? `${urlQuery.includes('accountId') ? '&' : ''}storeId=${storeId}` : '';
        urlQuery += tenantId ? `${(urlQuery.includes('accountId') || urlQuery.includes('storeId')) ? '&' : ''}tenantId=${tenantId}` : '';
        APISERVICE.GET(`${process.env.REACT_APP_BASE_PCS_URL}/whatsapp/getRechargeHistory?${urlQuery}`).then((response) => {
            if (response) res(response.data);
            else res([])
            // console.log("response", response);
        }).catch(function (error) {
            rej(error);
            console.log("error", error);
        });
    })
}

//get all stores wrt tenant in mysql _ (s_tenant_store)
export const addRechargeToAccount = (data) => {
    return new Promise((res, rej) => {
        APISERVICE.POST(`${process.env.REACT_APP_BASE_PCS_URL}/whatsapp/rechargeAccount`, data).then((response) => {
            if (response) res(response.data);
            else res([])
            // console.log("response", response);
        }).catch(function (error) {
            rej(error);
            console.log("error", error);
        });
    })
}

//get all stores wrt tenant in mysql _ (s_tenant_store)
export const addWhatsAppDetails = (data) => {
    return new Promise((res, rej) => {
        APISERVICE.POST(`${process.env.REACT_APP_BASE_PCS_URL}/whatsapp/addAccount`, data).then((response) => {
            if (response) res(response.data);
            else res([])
            // console.log("response", response);
        }).catch(function (error) {
            rej(error);
            console.log("error", error);
        });
    })
}

//get all stores wrt tenant in mysql _ (s_tenant_store)
export const updateWhatsAppDetails = (data) => {
    return new Promise((res, rej) => {
        APISERVICE.PUT(`${process.env.REACT_APP_BASE_PCS_URL}/whatsapp/updateAccount`, data).then((response) => {
            if (response) res(response.data);
            else res([])
            // console.log("response", response);
        }).catch(function (error) {
            rej(error);
            console.log("error", error);
        });
    })
}
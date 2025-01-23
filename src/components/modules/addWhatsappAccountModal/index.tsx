import * as React from 'react';
import { FC, useEffect, useState } from 'react';
import Backdrop from '@material-ui/core/Backdrop';
import CloseIcon from '@material-ui/icons/Close';
import { Select, MenuItem, Switch } from '@material-ui/core';
import { getAllTenants } from 'services/api/tenant';
import { getStoresByTenantId } from 'services/api/store';
import { addWhatsAppDetails } from 'services/api/whatsapp';
import Loader from '../loader';
import { showError, showSuccess } from 'redux/actions';
import { useAppDispatch } from 'hooks/useAppDispatch';

type pageProps = {
    resparkDetails: any,
    open: any,
    handleClose: any,
    tenantsList: any,
    storesList: any
}

const AddStoreToWhatsappModal: FC<pageProps> = ({ open, handleClose, resparkDetails, tenantsList, storesList }) => {
    let windowRef: any = window;
    const [isLoading, setIsLoading] = useState(false);
    const emptyClientObj = {
        "active": true,
        "tenantName": "",
        "storeName": "",
        "appId": "",
        "appSecret": "",
        "phoneNumber": "",
        "phoneNumberId": "",
        "wabaId": "",
        "accessToken": "",
        "version": null,
        "utilityBalance": 0,
        "marketingBalance": 0,
        "createdOn": new Date(),
        "marketingMsgCharge": 80,
        "utilityMsgCharge": 80,
        "isMarketingMsgs": true,
        "isUtilityMsgs": true,
        "rateLimit": 80,
        "clients": [{
            tenantId: 0,
            storeId: 0
        }]
    };
    const dispatch = useAppDispatch();
    const [whatsappClientDetails, setWhatsappClientDetails] = useState<any>({ ...emptyClientObj })
    const [error, setError] = useState<any>('');
    const [activeStores, setActiveStores] = useState<any>([]);

    useEffect(() => {
        setWhatsappClientDetails({ ...emptyClientObj });
        setError({});
    }, [open])

    const onChangeInput = (from: any, value: any, index: number = null) => {
        setError({})
        const detailsCopy = { ...whatsappClientDetails };
        if (from == 'tenant') {
            detailsCopy.clients[index].tenantId = value.id;
            detailsCopy.clients[index].storeId = 0;
        } else if (from == 'store') {
            detailsCopy.clients[index].storeId = value.id;
        } else {
            detailsCopy[from] = value;
        }
        setWhatsappClientDetails({ ...detailsCopy })
    }


    const onAddMoreClick = () => {
        setError({})
        const detailsCopy = { ...whatsappClientDetails };
        if (detailsCopy.clients[detailsCopy.clients.length - 1].tenantId && detailsCopy.clients[detailsCopy.clients.length - 1].storeId) {
            detailsCopy.clients.push({ tenantId: null, storeId: null })
            setWhatsappClientDetails({ ...detailsCopy })
        } else {
            if (!detailsCopy.clients[detailsCopy.clients.length - 1].storeId) setError({ text: 'Please select store', id: `store-${detailsCopy.clients.length - 1}` })
            if (!detailsCopy.clients[detailsCopy.clients.length - 1].tenantId) setError({ text: 'Please select tenant', id: `tenant-${detailsCopy.clients.length - 1}` })
        }
    }

    const onSave = () => {
        // if (!whatsappClientDetails.tenant) {
        //     setError({ text: 'Please select tenant', id: 'tenant' })
        // } else if (!whatsappClientDetails.store) {
        //     setError({ text: 'Please select store', id: 'store' })
        // } else
        if (!whatsappClientDetails.appId) {
            setError({ text: 'Please enter app id', id: 'appId' })
        } else if (!whatsappClientDetails.appSecret) {
            setError({ text: 'Please enter app secret', id: 'appSecret' })
        }
        //  else if (!whatsappClientDetails.phoneNumber) {
        //     setError({ text: 'Please enter app phone number', id: 'phoneNumber' })
        // } else if (!whatsappClientDetails.phoneNumberId) {
        //     setError({ text: 'Please enter app phone number id', id: 'phoneNumberId' })
        // } else if (!whatsappClientDetails.wabaId) {
        //     setError({ text: 'Please enter app waba id', id: 'wabaId' })
        // }
        // else if (whatsappClientDetails.isMarketingMsgs && !whatsappClientDetails.marketingMsgCharge) {
        //     setError({ text: 'Please enter charge rate', id: 'marketingMsgCharge' })
        // } else if (whatsappClientDetails.isUtilityMsgs && !whatsappClientDetails.utilityMsgCharge) {
        //     setError({ text: 'Please enter  charge rate', id: 'utilityMsgCharge' })
        // } 
        else {
            initFb()
        }
    }

    const onCancel = () => {
        handleClose();
    }

    const fbLogin = () => {
        try {
            windowRef.FB.login((resp) => {
                if (resp) {
                    const apiBody = {
                        ...whatsappClientDetails,
                        "tenantName": whatsappClientDetails.tenant.name,
                        "storeName": whatsappClientDetails.store.name,
                        "accessToken": resp?.authResponse?.accessToken || '758097095478222'//temporary (2 days) access token from facebook  
                    }
                    delete apiBody.tenant;
                    delete apiBody.store;
                    addWhatsAppDetails(apiBody).then((res) => {
                        dispatch(showSuccess('Client whatsapp onboarded successfully'))
                        setIsLoading(false);
                        handleClose(res || apiBody);
                    })
                } else {
                    console.log('Client access token generation failed or login failed')
                    dispatch(showError('Client registration faild'))
                    setIsLoading(false);
                }
            }, {
                scope: "whatsapp_business_management,whatsapp_business_messaging"
            })
        } catch (error: any) {
            console.log('Client access token generation failed or login failed:', error)
            dispatch(showError('Client registration faild'))
            setIsLoading(false);
        }
    }

    const initFb = () => {
        setIsLoading(true);
        try {
            if (!document.getElementById("fbSdkTag")) {
                let scriptEle = document.createElement("script");
                scriptEle.setAttribute("id", "fbSdkTag");
                scriptEle.setAttribute("src", "https://connect.facebook.net/en_GB/sdk.js");
                scriptEle.setAttribute("type", "text/javascript");
                scriptEle.setAttribute("async", "true");
                document.getElementById("fbLogin")!.appendChild(scriptEle);
                // success event 
                scriptEle.addEventListener("load", () => {
                    windowRef = window;
                    windowRef.fbAsyncInit = function () {
                        let f = windowRef.FB.init({
                            appId: whatsappClientDetails.appId,
                            autoLogAppEvents: true,
                            xfbml: true,
                            version: 'v16.0'
                        });
                        fbLogin();
                    };
                });
            } else {
                fbLogin();
            }
        } catch (error: any) {
            console.log('Client access token generation failed or login failed:', error)
            dispatch(showError('FB login faild'))
            setIsLoading(false);
        }
    }

    return (
        <Backdrop
            className="common-modal-wrap add-store-to-whatsapp-modal-wrap"
            open={open}
        >
            <div className=" modal-content-wrap" style={{ height: `${open ? 'auto' : '0'}`, width: '660px' }}>
                <div className="close-modal" onClick={() => handleClose()}>
                    <CloseIcon />
                </div>
                <div className="heading"> Register account to whatsapp</div>
                <div className='modal-content'>

                    <div className={`element-group-wrap card`}>
                        <div className='element-group card'>
                            <div className="input-wrap">
                                <div className='label'>App ID<span className='mandatory'>*</span></div>
                                <input className={`${error.id == 'appId' ? 'error ' : ''}`}
                                    autoComplete="off"
                                    type="text"
                                    value={whatsappClientDetails.appId || ''}
                                    onChange={(e) => onChangeInput('appId', e.target.value)}
                                    placeholder="App id*"
                                />
                                {error.id == 'appId' && <div className="error error-text">{error.text}</div>}
                            </div>
                        </div>

                        <div className='element-group card'>
                            <div className="input-wrap">
                                <div className='label'>App secret<span className='mandatory'>*</span></div>
                                <input className={`${error.id == 'appSecret' ? 'error ' : ''}`}
                                    autoComplete="off"
                                    value={whatsappClientDetails.appSecret || ''}
                                    onChange={(e) => onChangeInput('appSecret', e.target.value)}
                                    placeholder="App number*"
                                />
                                {error.id == 'appSecret' && <div className="error error-text">{error.text}</div>}
                            </div>
                        </div>
                        <div className='element-group card'>
                            <div className="input-wrap">
                                <div className='label'>App phone number<span className='mandatory'>*</span></div>
                                <input className={`${error.id == 'phoneNumber' ? 'error ' : ''}`}
                                    autoComplete="off"
                                    type="number"
                                    value={whatsappClientDetails.phoneNumber || ''}
                                    onChange={(e) => onChangeInput('phoneNumber', e.target.value)}
                                    placeholder="App phone number*"
                                />
                                {error.id == 'phoneNumber' && <div className="error error-text">{error.text}</div>}
                            </div>
                        </div>

                        <div className='element-group card'>
                            <div className="input-wrap">
                                <div className='label'>App phone number id<span className='mandatory'>*</span></div>
                                <input className={`${error.id == 'phoneNumberId' ? 'error ' : ''}`}
                                    autoComplete="off"
                                    value={whatsappClientDetails.phoneNumberId || ''}
                                    onChange={(e) => onChangeInput('phoneNumberId', e.target.value)}
                                    placeholder="App phone number id*"
                                />
                                {error.id == 'phoneNumberId' && <div className="error error-text">{error.text}</div>}
                            </div>
                        </div>
                        <div className='element-group card'>
                            <div className="input-wrap">
                                <div className='label'>WABA Id<span className='mandatory'>*</span></div>
                                <input className={`${error.id == 'wabaId' ? 'error ' : ''}`}
                                    autoComplete="off"
                                    type="text"
                                    value={whatsappClientDetails.wabaId || ''}
                                    onChange={(e) => onChangeInput('wabaId', e.target.value)}
                                    placeholder="App WABA id*"
                                />
                                {error.id == 'wabaId' && <div className="error error-text">{error.text}</div>}
                            </div>
                        </div>

                        {/* <div className='element-group card'>
                            <div className="input-wrap">
                                <div className='label'>Access Token</div>
                                <input className={`${error.id == 'accessToken' ? 'error ' : ''}`}
                                    autoComplete="off"
                                    readOnly
                                    value={whatsappClientDetails.accessToken || ''}
                                    onChange={(e) => onChangeInput('accessToken', e.target.value)}
                                    placeholder="Generat after fb login"
                                />
                                {error.id == 'accessToken' && <div className="error error-text">{error.text}</div>}
                            </div>
                        </div> */}
                    </div>

                    {whatsappClientDetails.clients.map((client: any, index: number) => {
                        return <React.Fragment key={index}>
                            <div className='element-group-wrap'>
                                <div className='element-group card'>
                                    <div className="input-wrap">
                                        <div className='label'>Tenant<span className='mandatory'>*</span></div>
                                        <Select
                                            className={`input ${error.id == 'tenant' ? 'error ' : ''}`}
                                            labelId="paid-via-label"
                                            placeholder='Select tenant'
                                            value={client.tenantId ? tenantsList.find((t: any) => t.id == client.tenantId) : ''}
                                            onChange={(e) => onChangeInput('tenant', e.target.value, index)}
                                        >
                                            {tenantsList.map((tenant: any, i: number) => {
                                                return <MenuItem className='sub-heading' value={tenant} key={i}>{tenant.name} ({tenant.id})</MenuItem>
                                            })}
                                        </Select>
                                        {error.id == `tenant-${index}` && <div className="error error-text">{error.text}</div>}
                                    </div>
                                </div>
                                <div className='element-group card'>
                                    <div className="input-wrap">
                                        <div className='label'>Store<span className='mandatory'>*</span></div>
                                        <Select
                                            className={`input ${error.id == 'store' ? 'error ' : ''}`}
                                            labelId="paid-via-label"
                                            placeholder='Select store'
                                            value={(client.tenantId && client.storeId) ? storesList.find((s: any) => (s.id == client.storeId && s.tenantId == client.tenantId)) : ''}
                                            onChange={(e) => onChangeInput('store', e.target.value, index)}
                                        >
                                            {storesList.filter((s: any) => s.tenantId == client.tenantId).map((store: any, i: number) => {
                                                return <MenuItem className='sub-heading' value={store} key={i}>{store.name} ({store.id})</MenuItem>
                                            })}
                                        </Select>
                                        {error.id == `store-${index}` && <div className="error error-text">{error.text}</div>}
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
                    })}

                    <div className='card add-more-btn-wrap'>
                        <div className='primary-btn border-btn' onClick={onAddMoreClick}>
                            Add More Client
                        </div>
                    </div>


                    <div className={`element-group-wrap card`}>
                        <div className='element-group switch-wrap card'>
                            <Switch
                                checked={whatsappClientDetails.isMarketingMsgs}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChangeInput('isMarketingMsgs', event.target.checked)}
                            />
                            <div className='label' onClick={(event: any) => onChangeInput('isMarketingMsgs', !whatsappClientDetails.isMarketingMsgs)}>Is marketing messages enabled</div>
                        </div>
                        <div className={`element-group card ${!whatsappClientDetails.isMarketingMsgs ? 'disabled' : ''}`}>
                            <div className="input-wrap">
                                <div className='label'>Charge per message(Paisa)<span className='mandatory'>*</span></div>
                                <input className={`${error.id == 'marketingMsgCharge' ? 'error ' : ''}`}
                                    autoComplete="off"
                                    type="text"
                                    value={(whatsappClientDetails.marketingMsgCharge) || ''}
                                    onChange={(e) => onChangeInput('marketingMsgCharge', e.target.value)}
                                    placeholder="Charge per message*"
                                />
                                {error.id == 'marketingMsgCharge' && <div className="error error-text">{error.text}</div>}
                            </div>
                        </div>
                    </div>

                    <div className={`element-group-wrap card`}>
                        <div className='element-group switch-wrap card'>
                            <Switch
                                checked={whatsappClientDetails.isUtilityMsgs}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChangeInput('isUtilityMsgs', event.target.checked)}
                            />
                            <div className='label' onClick={(event: any) => onChangeInput('isUtilityMsgs', !whatsappClientDetails.isUtilityMsgs)}>Is utility messages enabled</div>
                        </div>
                        <div className={`element-group card ${!whatsappClientDetails.isUtilityMsgs ? 'disabled' : ''}`}>
                            <div className="input-wrap">
                                <div className='label'>Charge per message(Paisa)<span className='mandatory'>*</span></div>
                                <input className={`${error.id == 'utilityMsgCharge' ? 'error ' : ''}`}
                                    autoComplete="off"
                                    type="text"
                                    value={(whatsappClientDetails.utilityMsgCharge) || ''}
                                    onChange={(e) => onChangeInput('utilityMsgCharge', e.target.value)}
                                    placeholder="Charge per message*"
                                />
                                {error.id == 'utilityMsgCharge' && <div className="error error-text">{error.text}</div>}
                            </div>
                        </div>
                        {/* 
                        <div className='element-group card'>
                            <div className="input-wrap">
                                <div className='label'>Balance<span className='mandatory'>*</span></div>
                                <input className={`${error.id == 'marketingBalance' ? 'error ' : ''}`}
                                    autoComplete="off"
                                    value={whatsappClientDetails.marketingBalance || ''}
                                    onChange={(e) => onChangeInput('marketingBalance', e.target.value)}
                                    placeholder="Balance*"
                                />
                                {error.id == 'marketingBalance' && <div className="error error-text">{error.text}</div>}
                            </div>
                        </div> */}
                    </div>

                    <div className='footer-btn-wrap clearfix'>
                        {/* <div id="fbLogin">
                            <button onClick={initFb} disabled={!(whatsappClientDetails.appId && whatsappClientDetails.appSecret)}>Login with Facebook</button>
                        </div> */}
                        <div id="fbLogin" className="primary-btn" onClick={onSave}>Add</div>
                        <div className="primary-btn border-btn" onClick={onCancel}>Cancel</div>
                    </div>
                </div>
                {isLoading && <Loader />}
            </div>
        </Backdrop>
    );
}

export default AddStoreToWhatsappModal;
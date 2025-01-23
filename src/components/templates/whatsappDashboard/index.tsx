import Checkbox from '@material-ui/core/Checkbox';
import AddWhatsappRechargeModal from 'components/modules/addWhatsappRechargeModal';
import Close from 'components/svgs/Close';
import SearchIcon from 'components/svgs/SearchIcon'
import { BACKGROUND_COLORS } from 'constants/common'
import React, { useEffect, useState } from 'react'
import { getAllWhatsappAccounts, getRechargeHistoryById, updateWhatsAppDetails } from 'services/api/whatsapp';
import { convertToRupees, getDateObj } from 'helpers/utils';
import { useAppDispatch } from 'hooks/useAppDispatch';
import { showSuccess } from 'redux/actions';
import Loader from 'components/modules/loader';
import { getAllTenantsMinimal } from 'services/api/tenant';
import { getAllStoresMinimal } from 'services/api/store';
import { MenuItem, Select } from '@material-ui/core';
import AddStoreToWhatsappModal from 'components/modules/addWhatsappAccountModal';

function WhatsappDashboard() {
    const [whatsappAccountsList, setWhatsappAccountsList] = useState([]);
    const [activeAccount, setActiveAccount] = useState<any>(null);
    const [rechargeHistory, setRechargeHistory] = useState([])
    const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
    const [showAddStoreToWhatsappModal, setShowAddStoreToWhatsappModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showRechargeHistory, setShowRechargeHostory] = useState(false);
    const dispatch = useAppDispatch()
    const [isLoading, setIsLoading] = useState(false);
    const [tenantsList, setTenantsList] = useState([])
    const [storesList, setStoresList] = useState([])
    const [error, setError] = useState<any>('');

    useEffect(() => {
        setIsLoading(true);
        getAllTenantsMinimal().then((tenantsList: any) => {
            getAllStoresMinimal().then((storesList: any) => {
                setStoresList(storesList);
                setTenantsList(tenantsList);
                getAllWhatsappAccounts().then((accountsListRes: any) => {
                    accountsListRes.map((account: any, index: number) => {
                        if (index != 0) {
                            account.clients.map((client: any) => {
                                client.tenantName = tenantsList.find((t: any) => t.id == client.tenantId).name;
                                client.storeName = storesList.find((s: any) => s.id == client.storeId && s.tenantId == client.tenantId).name;
                            })
                        }
                        if (index == accountsListRes.length - 1) {
                            setWhatsappAccountsList(accountsListRes);
                            console.log(accountsListRes[0])
                            setIsLoading(false)
                        }
                    })

                })
            })
        })


    }, [])

    const onClickAccount = (account: any) => {
        setActiveAccount({ ...account });
        setRechargeHistory([]);
        setShowRechargeHostory(false);
    }

    const onClickShowHistory = () => {
        if (rechargeHistory.length == 0) {
            getRechargeHistoryById(activeAccount.id, activeAccount.tenantId, activeAccount.storeId).then((historyRes: any) => {
                setShowRechargeHostory(true);
                setRechargeHistory(historyRes);
            })
        }
    }
    const handleRechargeModalResponse = (rechargeData: any) => {
        if (rechargeData) {
            dispatch(showSuccess('Recharge added successfully'))
            if (rechargeHistory.length == 0) {
                getRechargeHistoryById(activeAccount.id, activeAccount.tenantId, activeAccount.storeId).then((historyRes: any) => {
                    setShowRechargeHostory(true);
                    setRechargeHistory([...historyRes])
                })
            } else {
                setRechargeHistory([...rechargeHistory, rechargeData])
            }
            setActiveAccount({ ...activeAccount, [rechargeData.type == 'UTILITY' ? 'utilityBalance' : 'marketingBalance']: rechargeData.afterBalance });
        }
        setShowAddBalanceModal(false)
    }

    const handleAddWhatsappStoreModalResponse = (modalData: any) => {
        if (modalData) {
            const accounts = [...whatsappAccountsList];
            let index = accounts.findIndex((c) => c.tenantId == modalData.tenantId && c.storeId == modalData.storeId);
            if (index == -1) {
                accounts.push(modalData);
            } else {
                accounts[index] = modalData;
            }
            setWhatsappAccountsList([...accounts]);
        }
        setShowAddStoreToWhatsappModal(false);
    }

    const onCancel = () => {
        setActiveAccount(null);
    }

    const onSave = () => {
        console.log(activeAccount)
        setIsLoading(true);
        const apiBody = { ...activeAccount };
        delete apiBody.accessToken;
        updateWhatsAppDetails(apiBody).then((res) => {
            dispatch(showSuccess('Account updated successfully'))
            setIsLoading(false);
        })
    }

    const onSearchChange = (query: any) => {
        setSearchQuery(query ? query.toLowerCase() : '');
    }

    const onChangeInput = (from: any, value: any, index: number = null) => {
        setError({})
        const detailsCopy = { ...activeAccount };
        if (from == 'tenant') {
            detailsCopy.clients[index].tenantId = value.id;
            detailsCopy.clients[index].storeId = 0;
        } else if (from == 'store') {
            detailsCopy.clients[index].storeId = value.id;
        } else {
            detailsCopy[from] = value.name;
        }
        setActiveAccount({ ...detailsCopy })
    }

    const onDeleteClick = (index: any) => {
        const detailsCopy = { ...activeAccount };
        detailsCopy.clients.splice(index, 1)
        setActiveAccount({ ...detailsCopy })
    }

    const onAddMoreClick = () => {
        setError({})
        const detailsCopy = { ...activeAccount };
        if (detailsCopy.clients[detailsCopy.clients.length - 1].tenantId && detailsCopy.clients[detailsCopy.clients.length - 1].storeId) {
            detailsCopy.clients.push({ tenantId: null, storeId: null })
            setActiveAccount({ ...detailsCopy })
        } else {
            if (!detailsCopy.clients[detailsCopy.clients.length - 1].storeId) setError({ text: 'Please select store', id: `store-${detailsCopy.clients.length - 1}` })
            if (!detailsCopy.clients[detailsCopy.clients.length - 1].tenantId) setError({ text: 'Please select tenant', id: `tenant-${detailsCopy.clients.length - 1}` })
        }
    }

    const getFilteredAccounts = () => {
        return whatsappAccountsList.filter((account: any) => {
            let isValid = false;
            if (account.clients[0].tenantId == 0 || account.phoneNumber.includes(searchQuery)) isValid = true;
            else {
                account.clients.map((client: any) => {
                    let tenant = tenantsList.find((t: any) => t.id == client.tenantId)?.name;
                    let store = storesList.find((s: any) => (s.id == client.storeId && s.tenantId == client.tenantId))?.name;
                    if (tenant.toLowerCase().includes(searchQuery) || store.toLowerCase().includes(searchQuery)) isValid = true;
                })
            }
            return isValid;
        });
    }

    return (
        <div className='whatsapp-dashboard-container'>
            <div className='left-content'>
                <div className='search-wrap'>
                    {!searchQuery ? <div className='search-icon'>
                        {SearchIcon()}
                    </div> :
                        <div className='search-icon' onClick={() => onSearchChange(null)}>
                            {Close()}
                        </div>}
                    <input placeholder='Search by tenent name' value={searchQuery || ''} onChange={(e) => onSearchChange(e.target.value)} />
                </div>
                <div className='tenant-list-wrap'>
                    {getFilteredAccounts().map((account: any, i: number) => {
                        const isResparkAccount = account.clients[0].tenantId == 0
                        return <React.Fragment key={i} >
                            {<div className='tenant-details' onClick={() => onClickAccount(account)} style={{ backgroundColor: account.clients[0].tenantId == 0 ? '#04c8c80f' : BACKGROUND_COLORS[account.id] }}>
                                <div className='details-row  d-f-fs f-d-c'>
                                    {isResparkAccount ?
                                        <div className='avl-blns name'>Respark Account</div>
                                        : <div className='avl-blns name'>
                                            {account.clients.map((client: any, i: number) => {
                                                return <React.Fragment key={i}>
                                                    {tenantsList.find((t: any) => t.id == client.tenantId)?.name} {storesList.find((s: any) => (s.id == client.storeId && s.tenantId == client.tenantId))?.name}
                                                </React.Fragment>
                                            })}
                                        </div>}

                                    <div className='avl-blns date'>Marketing- <span>₹{(account.marketingBalance || 0) / 100}</span></div>
                                    <div className='avl-blns date'>Utility- <span>₹{(account.utilityBalance || 0) / 100}</span></div>
                                    <div className='avl-blns date'>{new Date(account.createdOn).toDateString()}</div>
                                </div>
                            </div>}
                        </React.Fragment>
                    })}
                </div>
                <div className='footer-btn-wrap'>
                    <div className='primary-btn' onClick={() => setShowAddStoreToWhatsappModal(true)}>Add Account</div>
                </div>
            </div>
            <div className='right-content'>
                {activeAccount ? <div className='tenant-details-wrap'>
                    <div className='details-row logo-name-wrap'>
                        <div className='heading tenant-name'>{activeAccount?.tenantName} - <div className='sub-heading'>{activeAccount?.storeName}</div></div>
                        <div className='date'>Registered on: {new Date(activeAccount?.createdOn).toDateString()}</div>
                    </div>

                    <div className='tenant-details-outer'>
                        <div className='tenant-details card'>
                            <div className='details-row blns-wrap'>
                                <div className='details-col'>
                                    <div className='value'>{activeAccount?.appId}</div>
                                    <div className='title'>App Id</div>
                                </div>
                                <div className='details-col'>
                                    <div className='value'>{activeAccount?.appSecret}</div>
                                    <div className='title'>App Secret</div>
                                </div>
                                <div className='details-col'>
                                    <div className='value'>{activeAccount?.phoneNumber}</div>
                                    <div className='title'>Phone Number</div>
                                </div>
                                <div className='details-col'>
                                    <div className='value'>{activeAccount?.phoneNumberId}</div>
                                    <div className='title'>Phone Number Id</div>
                                </div>
                                <div className='details-col'>
                                    <div className='value'>{activeAccount?.wabaId}</div>
                                    <div className='title'>WABA Id</div>
                                </div>
                                <div className='details-col'>
                                    <div className='value'>{activeAccount?.accessToken}</div>
                                    <div className='title'>Access Token</div>
                                </div>
                            </div>
                        </div>

                        <div className='card'>
                            <div className='sub-heading'>Marketing Messages</div>
                            <div className='config-input-wrap d-f-fs gap-10'>
                                <div className="checkbox-input-wrapper">
                                    <div className="checkbox-input-wrap ckeckbox-wrap">
                                        <Checkbox
                                            checked={activeAccount?.isMarketingMsgs || false}
                                            onClick={() => setActiveAccount({ ...activeAccount, isMarketingMsgs: !activeAccount.isMarketingMsgs })}
                                            inputProps={{ 'aria-label': 'controlled' }}
                                        />
                                        <div className="label" onClick={() => setActiveAccount({ ...activeAccount, isMarketingMsgs: !activeAccount.isMarketingMsgs })}>Enable marketing messages</div>
                                    </div>
                                </div>
                                <div className='details-col d-f-fs f-d-c'>
                                    <div className='title'>Balance(Rupees)</div>
                                    <input
                                        value={activeAccount.marketingBalance ? `₹ ${(activeAccount.marketingBalance || 0) / 100}` : '₹0'}
                                        placeholder="Charge per message"
                                        readOnly
                                        onChange={(e: any) => setActiveAccount({ ...activeAccount, marketingBalance: e.target.value })}
                                    />
                                </div>
                                <div className='details-col d-f-fs f-d-c'>
                                    <div className='title'>Charge per message(Paisa)</div>
                                    <input
                                        type={'number'}
                                        value={(activeAccount.marketingMsgCharge) || ''}
                                        placeholder="Charge per message"
                                        onChange={(e: any) => setActiveAccount({ ...activeAccount, marketingMsgCharge: e.target.value })}
                                    />
                                </div>
                                <div className='details-col d-f-fs f-d-c'>
                                    <div className='title'>Available Messages</div>
                                    <input
                                        value={(activeAccount.marketingBalance && activeAccount.marketingMsgCharge) ? `${((activeAccount.marketingBalance / activeAccount.marketingMsgCharge) || 0).toFixed()}` : '0'}
                                        placeholder="Available Messages"
                                        readOnly
                                        onChange={(e: any) => setActiveAccount({ ...activeAccount, marketingBalance: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className='card'>
                            <div className='sub-heading'>Utility Messages</div>
                            <div className='config-input-wrap d-f-fs gap-10'>
                                <div className="checkbox-input-wrapper">
                                    <div className="checkbox-input-wrap ckeckbox-wrap">
                                        <Checkbox
                                            checked={activeAccount?.isUtilityMsgs || false}
                                            onClick={() => setActiveAccount({ ...activeAccount, isUtilityMsgs: !activeAccount.isUtilityMsgs })}
                                            inputProps={{ 'aria-label': 'controlled' }}
                                        />
                                        <div className="label" onClick={() => setActiveAccount({ ...activeAccount, isUtilityMsgs: !activeAccount.isUtilityMsgs })}>Enable Utility messages</div>
                                    </div>
                                </div>
                                <div className='details-col d-f-fs f-d-c'>
                                    <div className='title'>Balance(Rupees)</div>
                                    <input
                                        value={activeAccount.utilityBalance ? `₹ ${(activeAccount.utilityBalance || 0) / 100}` : '₹0'}
                                        placeholder="Charge per message"
                                        readOnly
                                        onChange={(e: any) => setActiveAccount({ ...activeAccount, utilityBalance: e.target.value })}
                                    />
                                </div>
                                <div className='details-col d-f-fs f-d-c'>
                                    <div className='title'>Charge per message(Paisa)</div>
                                    <input
                                        type={'number'}
                                        value={(activeAccount.utilityMsgCharge) || ''}
                                        placeholder="Charge per message"
                                        onChange={(e: any) => setActiveAccount({ ...activeAccount, utilityMsgCharge: e.target.value })}
                                    />
                                </div>
                                <div className='details-col d-f-fs f-d-c'>
                                    <div className='title'>Available Messages</div>
                                    <input
                                        value={(activeAccount.utilityBalance && activeAccount.utilityMsgCharge) ? `${((activeAccount.utilityBalance / activeAccount.utilityMsgCharge) || 0).toFixed()}` : '0'}
                                        placeholder="Available Messages"
                                        readOnly
                                        onChange={(e: any) => setActiveAccount({ ...activeAccount, utilityBalance: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className='card'>
                            <div className='sub-heading'>Clients List</div>
                            {activeAccount.clients.map((client: any, index: number) => {
                                return <React.Fragment key={index}>
                                    <div className='config-input-wrap d-f-fs gap-10 clints-list-wrap'>
                                        <div className='card'>
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
                                        <div className='card'>
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
                                        {activeAccount.clients.length > 1 && <div className='icon-wrap' onClick={() => onDeleteClick(index)}>X</div>}
                                    </div>
                                </React.Fragment>
                            })}
                        </div>

                        <div className='card add-more-btn-wrap'>
                            <div className='primary-btn border-btn' onClick={onAddMoreClick}>
                                Add More Client
                            </div>
                        </div>

                        {showRechargeHistory ? <>
                            {rechargeHistory.length != 0 ? <>
                                <div className='history-wrap'>
                                    <div className='heading'>Recharge History</div>
                                    <div className='history-content card'>
                                        <div className='history-list'>
                                            {rechargeHistory.map((rechargDetails: any, i: number) => {
                                                return <React.Fragment key={Math.random()}>

                                                    {i == 0 && <div className='details-row'>
                                                        <div className='details-col'>No.</div>
                                                        <div className='details-col'>Previous Balance(₹)</div>
                                                        <div className='details-col'>Added Balance(₹)</div>
                                                        <div className='details-col'>After Balance(₹)</div>
                                                        <div className='details-col'>Charges(₹)</div>
                                                        <div className='details-col'>Added Messages</div>
                                                        <div className='details-col'>Paid Via</div>
                                                        <div className='details-col'>Staff</div>
                                                        <div className='details-col'>Date</div>
                                                        <div className='details-col'>Type</div>
                                                    </div>}

                                                    <div className='details-row' key={i}>
                                                        <div className='details-col'>{i + 1}</div>
                                                        <div className='details-col'>{(rechargDetails?.prevBalance) / 100}</div>
                                                        <div className='details-col'>{(rechargDetails?.amount) / 100}</div>
                                                        <div className='details-col'>{(rechargDetails?.afterBalance) / 100}</div>
                                                        <div className='details-col'>{(rechargDetails?.chargePerMessage) / 100}</div>
                                                        <div className='details-col'>{((rechargDetails?.amount) / (rechargDetails.chargePerMessage)).toFixed()}</div>
                                                        <div className='details-col'>{rechargDetails?.paidVia}</div>
                                                        <div className='details-col'>{(rechargDetails?.staff)}</div>
                                                        <div className='details-col'>{getDateObj(new Date(rechargDetails?.createdOn)).dateObj}</div>
                                                        <div className='details-col'>{rechargDetails?.type}</div>
                                                    </div>
                                                </React.Fragment>

                                            })}
                                            <div className='details-row total-row'>
                                                <div className='details-col'>Total</div>
                                                <div className='details-col'>{(rechargeHistory.reduce((a: any, b: any) => Number(a) + Number(b.prevBalance), 0)) / 100}</div>
                                                <div className='details-col'>{(rechargeHistory.reduce((a: any, b: any) => Number(a) + Number((b?.amount)), 0)) / 100}</div>
                                                <div className='details-col'>{(rechargeHistory.reduce((a: any, b: any) => Number(a) + Number((b?.afterBalance)), 0)) / 100}</div>
                                                <div className='details-col'>-</div>
                                                <div className='details-col'>{(rechargeHistory.reduce((a: any, b: any) => Number((Number(a) + Number(((b?.amount) / (b.chargePerMessage)).toFixed())).toFixed(1)), 0))}</div>
                                                <div className='details-col'>-</div>
                                                <div className='details-col'>-</div>
                                                <div className='details-col'>-</div>
                                                <div className='details-col'>-</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </> : <>
                                <div className='history-wrap card'>
                                    <div className='heading'>Recharge History Not Available</div>
                                </div>
                            </>}
                        </> : <>
                            <div className='history-wrap card' onClick={onClickShowHistory}>
                                <div className='heading'>Show Recharge History</div>
                            </div>
                        </>}

                    </div>

                    <div className='btn-wrap footer-btn-wrap'>
                        <div className='btn primary-btn border-btn' onClick={onCancel}>Cancel</div>
                        <div className='btn primary-btn ' onClick={() => setShowAddBalanceModal(true)}>Add Recharge +</div>
                        <div className='btn primary-btn ' onClick={onSave}>Update</div>
                    </div>
                </div> : <div className='no-data'>Select store to view whatsapp integration details</div>}
                {showAddBalanceModal && <AddWhatsappRechargeModal
                    open={showAddBalanceModal}
                    activeAccount={activeAccount}
                    handleClose={(rechargeData: any) => handleRechargeModalResponse(rechargeData)}
                />}
            </div>
            {showAddStoreToWhatsappModal && <AddStoreToWhatsappModal
                tenantsList={tenantsList}
                storesList={storesList}
                resparkDetails={whatsappAccountsList.filter((c: any) => c.tenantId == '000')}
                open={showAddStoreToWhatsappModal}
                handleClose={(rechargeData: any) => handleAddWhatsappStoreModalResponse(rechargeData)}
            />}
            {isLoading && <Loader />}
        </div>
    )
}

export default WhatsappDashboard
import * as React from 'react';
import { FC, useEffect, useState } from 'react';
import Backdrop from '@material-ui/core/Backdrop';
import CloseIcon from '@material-ui/icons/Close';
import { Select, MenuItem } from '@material-ui/core';
import { PAYMENT_TYPES } from 'constants/common';
import { addRechargeToAccount } from 'services/api/whatsapp';
import { convertToRupees } from 'helpers/utils';

type pageProps = {
    open: any,
    handleClose: any,
    activeAccount: any
}

const AddWhatsappRechargeModal: FC<pageProps> = ({ open, handleClose, activeAccount }) => {

    const [rechargeDetails, setRechargeDetails] = useState({
        "amount": 0,
        "createdOn": new Date(),
        "paidVia": "",
        "staffId": 1,
        "staff": '',
        "storeId": activeAccount.storeId,
        "tenantId": activeAccount.tenantId,
        "accountId": activeAccount.id,
        "type": 'MARKETING',
        "afterBalance": activeAccount.marketingBalance,
        "prevBalance": activeAccount.marketingBalance,
        "chargePerMessage": activeAccount.marketingMsgCharge
    })
    const [error, setError] = useState<any>('');

    const onChangeInput = (from: any, value: any) => {
        setError({})
        const rechargeDetailsCopy = { ...rechargeDetails };
        rechargeDetailsCopy[from] = value;
        rechargeDetailsCopy.staffId = 1;
        rechargeDetailsCopy.staff = 'Added by RESPARK';
        // rechargeDetailsCopy.afterBalance = rechargeDetailsCopy.type == 'UTILITY' ? Number(Number(activeAccount.utilityBalance) + Number(rechargeDetailsCopy.amount)) : Number(activeAccount.marketingBalance + Number(rechargeDetailsCopy.amount));
        // rechargeDetailsCopy.prevBalance = rechargeDetailsCopy.type == 'UTILITY' ? activeAccount.utilityBalance : activeAccount.marketingBalance;
        rechargeDetailsCopy.chargePerMessage = rechargeDetailsCopy.type == 'UTILITY' ? activeAccount.utilityMsgCharge : activeAccount.marketingMsgCharge;
        setRechargeDetails(rechargeDetailsCopy)
    }

    const onSave = () => {
        if (!rechargeDetails.amount) {
            setError({ text: 'Please enter recharge amount', id: 'amount' })
        } else if (!rechargeDetails.paidVia || rechargeDetails.paidVia == 'Select Payment Type') {
            setError({ text: 'Please select recharge payment type', id: 'paidVia' })
        } else {
            addRechargeToAccount(rechargeDetails).then((res) => {
                handleClose(rechargeDetails);
            })
        }
    }

    const onCancel = () => {
        handleClose();
    }

    return (
        <Backdrop
            className="common-modal-wrap"
            open={open}
        // onClick={() => handleClose(false)}
        >
            <div className=" modal-content-wrap" style={{ height: `${open ? 'auto' : '0'}`, width: '400px' }}>
                <div className="close-modal" onClick={() => handleClose()}>
                    <CloseIcon />
                </div>
                <div className="heading"> Add Recharge</div>
                <div className='modal-content'>
                    <div className='element-group card'>
                        <div className="input-wrap">
                            <div className='label'>Amount<span className='mandatory'>*</span></div>
                            <input className={`${error.id == 'amount' ? 'error ' : ''}`}
                                autoComplete="off"
                                type="number"
                                value={convertToRupees(rechargeDetails.amount) || ''}
                                onChange={(e) => onChangeInput('amount', Number(e.target.value || 0) * 100)}
                                placeholder="Enter recharge amount*"
                            />
                            {error.id == 'amount' && <div className="error error-text">{error.text}</div>}
                        </div>
                    </div>
                    <div className='element-group card'>
                        <div className="input-wrap">
                            <div className='label'>Paid Via<span className='mandatory'>*</span></div>
                            <Select
                                className={`input ${error.id == 'paidVia' ? 'error ' : ''}`}
                                labelId="paid-via-label"
                                placeholder='Select payment type'
                                value={rechargeDetails.paidVia || 'Select Payment Type'}
                                label="Pais Via"
                                onChange={(e) => onChangeInput('paidVia', e.target.value)}
                            >
                                {[{ name: 'Select Payment Type' }, ...PAYMENT_TYPES].map((type: any, i: number) => {
                                    return <MenuItem className='sub-heading' value={type.name} key={i}>{type.name}</MenuItem>
                                })}
                            </Select>
                            {error.id == 'paidVia' && <div className="error error-text">{error.text}</div>}
                        </div>
                    </div>
                    <div className='element-group card'>
                        <div className="input-wrap">
                            <div className='label'>Type<span className='mandatory'>*</span></div>
                            <Select
                                className={`input ${error.id == 'type' ? 'error ' : ''}`}
                                labelId="paid-via-label"
                                placeholder='Select type'
                                value={rechargeDetails.type || 'Select Type'}
                                label="Pais Via"
                                onChange={(e) => onChangeInput('type', e.target.value)}
                            >
                                <MenuItem className='sub-heading' value={'MARKETING'}>MARKETING</MenuItem>
                                <MenuItem className='sub-heading' value={'UTILITY'}>UTILITY</MenuItem>
                            </Select>
                            {error.id == 'type' && <div className="error error-text">{error.text}</div>}
                        </div>
                    </div>
                    <div className='element-group card'>
                        <div className='details-row blns-wrap'>
                            <div className='details-col'>
                                <div className='value'>₹ {convertToRupees(rechargeDetails.prevBalance, 2)}</div>
                                <div className='title'>Current Balance</div>
                            </div>
                            <div className='details-col'>
                                <div className='value'>{Number(((rechargeDetails.prevBalance) / (rechargeDetails?.chargePerMessage)).toFixed())}</div>
                                <div className='title'>Current Messages</div>
                            </div>
                            <div className='details-col'>
                                <div className='value'>₹ {convertToRupees(rechargeDetails.amount, 2)}</div>
                                <div className='title'>Added Balance</div>
                            </div>
                            <div className='details-col'>
                                <div className='value'>{Number(((rechargeDetails.amount) / (rechargeDetails?.chargePerMessage)).toFixed())}</div>
                                <div className='title'>Added Messages</div>
                            </div>
                            <div className='details-col'>
                                <div className='value'>₹ {Number(convertToRupees(rechargeDetails?.afterBalance, 2))}</div>
                                <div className='title'>New Balance</div>
                            </div>
                            <div className='details-col'>
                                <div className='value'>{Number(((rechargeDetails?.afterBalance) / (rechargeDetails?.chargePerMessage)).toFixed())}</div>
                                <div className='title'>New Messages</div>
                            </div>
                        </div>
                    </div>
                    <div className='footer-btn-wrap clearfix'>
                        <div className="primary-btn" onClick={onSave}>Add</div>
                        <div className="primary-btn border-btn" onClick={onCancel}>Cancel</div>
                    </div>
                </div>
            </div>
        </Backdrop>
    );
}

export default AddWhatsappRechargeModal;
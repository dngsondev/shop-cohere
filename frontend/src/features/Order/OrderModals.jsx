import React from 'react';
import Modal from 'react-modal';
import { EditDeliveryModal } from '../../components';
import DeliveryInfoList from '../../components/EditDeliveryModal/DeliveryInfoList';
import VnpayPayment from '../../components/Payment/VnpayPayment';
import orderService from '../../services/orderService';

const OrderModals = ({
    modalIsOpen,
    showAddressList,
    showVnpayPayment,
    currentTempOrder,
    userInfo,
    address,
    onCloseModal,
    onCloseAddressList,
    onCloseVnpayPayment,
    onSelectAddress,
    onVnpaySuccess
}) => {
    // Style cho Modal danh sách địa chỉ
    const addressListModalStyles = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '600px',
            width: '95%',
            maxHeight: '85vh',
            borderRadius: '12px',
            padding: '0',
            border: 'none',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            zIndex: 1000
        },
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999
        }
    };

    const handleAddressChange = (newAddress) => {
        // Handle address change if needed
    };

    const handleUserInfoChange = (updatedInfo) => {
        // Handle user info change if needed
    };

    return (
        <>
            {/* Edit Delivery Modal */}
            <EditDeliveryModal
                isOpen={modalIsOpen}
                onClose={onCloseModal}
                onAddressChange={handleAddressChange}
                onUserInfoChange={handleUserInfoChange}
                initialAddress={address}
                initialUserInfo={userInfo}
            />

            {/* Address List Modal */}
            <Modal
                isOpen={showAddressList}
                onRequestClose={onCloseAddressList}
                style={addressListModalStyles}
                contentLabel="Danh sách địa chỉ giao hàng"
            >
                <DeliveryInfoList
                    onClose={onCloseAddressList}
                    onSelect={onSelectAddress}
                />
            </Modal>

            {/* VNPAY Payment Modal */}
            {showVnpayPayment && currentTempOrder && (
                <VnpayPayment
                    currentOrder={currentTempOrder}
                    orderService={orderService}
                    onClose={onCloseVnpayPayment}
                    onSuccess={onVnpaySuccess}
                />
            )}
        </>
    );
};

export default OrderModals;
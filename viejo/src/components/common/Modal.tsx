import React from 'react';
import { createPortal } from 'react-dom';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import './styles/Modal.css';

interface ModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning' | 'confirm';
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    title, 
    message, 
    type = 'info', 
    onClose, 
    onConfirm,
    confirmText = 'Aceptar',
    cancelText = 'Cancelar'
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <FaCheckCircle className="modal-icon success" />;
            case 'error': return <FaExclamationCircle className="modal-icon error" />;
            case 'warning': return <FaExclamationTriangle className="modal-icon warning" />;
            case 'confirm': return <FaExclamationTriangle className="modal-icon warning" />;
            default: return <FaInfoCircle className="modal-icon info" />;
        }
    };

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                </div>
                <div className="modal-body">
                    {getIcon()}
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    {type === 'confirm' ? (
                        <>
                            <button className="modal-btn secondary" onClick={onClose}>{cancelText}</button>
                            <button className="modal-btn primary" onClick={() => { onConfirm?.(); onClose(); }}>{confirmText}</button>
                        </>
                    ) : (
                        <button className="modal-btn primary" onClick={onClose}>{confirmText}</button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;

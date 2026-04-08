import type React from 'react';

export type ModalFormId =
  | 'delete-element-form'
  | 'animation-form'
  | 'circle-layout-form'
  | 'author-info-form'
  | string;

export interface ModalConfig {
  id?: string;
  isOpen?: boolean;
  formId: ModalFormId;
  title: string;
  content: React.ReactNode;
  onClose: () => void;
  stopWriting?: () => void;
  action?: () => void;
  buttonText?: string;
  buttonColor?: string;
  fixed?: boolean;
  iconName?: string;
  secondaryContent?: React.ReactNode;
}

export interface ModalInstance extends ModalConfig {
  id: string;
  isOpen: boolean;
  modalRef?: React.RefObject<HTMLDivElement>;
}

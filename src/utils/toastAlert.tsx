/* eslint-disable import/no-extraneous-dependencies */
import toast from 'react-hot-toast';

const toastAlert = (variant: 'success' | 'error', message: string) => {
  if (variant === 'success') {
    toast.success(message);
  } else if (variant === 'error') {
    toast.error(message);
  }
};
export default toastAlert;

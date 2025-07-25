import { toast } from 'react-toastify';

export const handleSuccess = (msg) => {
  toast.success(msg, {
    position: 'top-right',
    autoClose: 2000,
    hideProgressBar: false,
    pauseOnHover: true,
    closeOnClick: true,
    draggable: true,
  });
};

export const handleError = (msg) => {
  toast.error(msg, {
    position: 'top-right',
    autoClose: 2000,
    hideProgressBar: false,
    pauseOnHover: true,
    closeOnClick: true,
    draggable: true,
  });
};

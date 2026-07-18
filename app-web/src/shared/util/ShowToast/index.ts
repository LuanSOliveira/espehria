import { Bounce, ToastOptions, toast } from 'react-toastify';

type ToastType = {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  notification?: boolean;
};

export function showToast({
  message,
  type = 'success',
  notification = false,
}: ToastType) {
  const options = {
    position: notification ? 'bottom-left' : 'top-right',
    autoClose: notification ? false : 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'light',
    transition: Bounce,
  } as ToastOptions<unknown>;

  if (type === 'success') {
    toast.success(`${message}`, options);
  }

  if (type === 'error') {
    toast.error(`${message}`, options);
  }

  if (type === 'warning') {
    toast.warning(`${message}`, options);
  }

  if (type === 'info') {
    toast.dismiss();
    setTimeout(() => toast.info(`${message}`, options), 300);
  }
}

export const toastOptions = {
  position: 'bottom-center',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: false,
  pauseOnHover: true,
  draggable: false,
  draggablePercent: 0.6,
  showCloseButtonOnHover: true,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
  transition: 'Vue-Toastification__bounce',
  maxToasts: 1,
  newestOnTop: true,
  containerClassName: 'toast-container-compact',
  toastClassName: 'toast-compact',
  containerStyle: {
    bottom: '70px'
  }
}
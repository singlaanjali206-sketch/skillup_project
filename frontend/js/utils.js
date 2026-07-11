function showToast(message, type = "success") {
 const toast = document.createElement("div");
 toast.className =
 `alert alert-${type} alert-dismissible`;
 toast.innerHTML = message;
 document.getElementById("toastContainer")
 .appendChild(toast);
 setTimeout(() => {toast.remove();}, 3000);
 }

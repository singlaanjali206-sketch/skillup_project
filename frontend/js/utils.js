function showToast(message, type = "success") {
 // 1. Create the toast element
 const toast = document.createElement("div");
 // 2. Style it with Bootstrap alert classes
 toast.className =
 `alert alert-${type} alert-dismissible`;
 // 3. Set the message
 toast.innerHTML = message;
 // 4. Insert into the container
 document.getElementById("toastContainer")
 .appendChild(toast);
 // 5. Auto-remove after 3 seconds
 setTimeout(() => {
 toast.remove();
 }, 3000);
 }

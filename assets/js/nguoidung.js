// User Management JavaScript

let currentUsers = [];
let editMode = false;

// Initialize page
document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication and admin role
  try {
    const result = await AuthAPI.checkAuth();

    if (!result.authenticated) {
      showAlert("error", "Vui lòng đăng nhập để truy cập trang này");
      setTimeout(() => {
        window.location.href = "../login.html";
      }, 1500);
      return;
    }

    if (result.user.vaitro !== "admin") {
      showAlert(
        "error",
        "Bạn không có quyền truy cập trang này. Chỉ Admin mới được phép."
      );
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 2000);
      return;
    }

    // Update navbar
    updatePageNavbar(result.user);
  } catch (error) {
    showAlert("error", "Không thể xác thực. Vui lòng đăng nhập lại.");
    setTimeout(() => {
      window.location.href = "../login.html";
    }, 1500);
    return;
  }

  // Load users
  await loadUsers();

  // Setup event listeners
  setupEventListeners();
});

// Update navbar with user info
function updatePageNavbar(user) {
  const authNav = document.getElementById("authNav");
  if (!authNav) return;

  const roleLabels = {
    admin: "Quản trị viên",
    nhanvien: "Nhân viên",
    khachhang: "Khách hàng",
  };

  authNav.innerHTML = `
    <li class="nav-item dropdown">
      <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
        <i class="bi bi-person-circle"></i> ${user.hoten}
        <span class="badge bg-secondary">${roleLabels[user.vaitro]}</span>
      </a>
      <ul class="dropdown-menu dropdown-menu-end">
        <li><h6 class="dropdown-header">${user.tendangnhap}</h6></li>
        <li><hr class="dropdown-divider"></li>
        <li>
          <a class="dropdown-item" href="#" onclick="handlePageLogout(); return false;">
            <i class="bi bi-box-arrow-right"></i> Đăng xuất
          </a>
        </li>
      </ul>
    </li>
  `;
}

// Handle logout on pages
async function handlePageLogout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
    try {
      await AuthAPI.logout();
      localStorage.removeItem("user");
      showAlert("success", "Đăng xuất thành công!");
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);
    } catch (error) {
      // Error already shown by API
    }
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search
  document.getElementById("searchInput").addEventListener("input", filterUsers);

  // Filter by role
  document.getElementById("filterRole").addEventListener("change", filterUsers);

  // Filter by status
  document
    .getElementById("filterStatus")
    .addEventListener("change", filterUsers);

  // Add user button
  document.getElementById("btnAddUser").addEventListener("click", function () {
    editMode = false;
    document.getElementById("modalTitle").innerHTML =
      '<i class="bi bi-person-plus"></i> Thêm người dùng mới';
    document.getElementById("userForm").reset();
    document.getElementById("mand").value = "";
    document.getElementById("tendangnhap").removeAttribute("readonly");
    document.getElementById("matkhau").setAttribute("required", "required");
    document.getElementById("passwordRequired").style.display = "inline";
    document.getElementById("passwordHelp").style.display = "inline";
    document.getElementById("passwordEditHelp").style.display = "none";
  });

  // Save user button
  document.getElementById("btnSaveUser").addEventListener("click", saveUser);

  // Toggle password visibility
  document
    .getElementById("togglePassword")
    .addEventListener("click", function () {
      const passwordField = document.getElementById("matkhau");
      const icon = this.querySelector("i");
      if (passwordField.type === "password") {
        passwordField.type = "text";
        icon.classList.replace("bi-eye", "bi-eye-slash");
      } else {
        passwordField.type = "password";
        icon.classList.replace("bi-eye-slash", "bi-eye");
      }
    });
}

// Load users from API
async function loadUsers() {
  try {
    showLoading(document.getElementById("usersTableBody"));

    const response = await UserAPI.getAll();
    currentUsers = response.data || [];

    displayUsers(currentUsers);
  } catch (error) {
    showEmptyState(
      document.getElementById("usersTableBody"),
      "Không thể tải dữ liệu người dùng"
    );
  }
}

// Display users in table
function displayUsers(users) {
  const tbody = document.getElementById("usersTableBody");

  if (users.length === 0) {
    showEmptyState(tbody, "Không tìm thấy người dùng nào");
    return;
  }

  const roleLabels = {
    admin: '<span class="badge bg-danger">Quản trị viên</span>',
    nhanvien: '<span class="badge bg-info">Nhân viên</span>',
    khachhang: '<span class="badge bg-secondary">Khách hàng</span>',
  };

  const statusLabels = {
    active: '<span class="badge bg-success">Đang hoạt động</span>',
    inactive: '<span class="badge bg-danger">Đã khóa</span>',
  };

  tbody.innerHTML = users
    .map(
      (user) => `
        <tr>
            <td>${user.mand}</td>
            <td>${user.tendangnhap}</td>
            <td>${user.hoten}</td>
            <td>${user.email}</td>
            <td>${user.sodienthoai || "-"}</td>
            <td>${roleLabels[user.vaitro]}</td>
            <td>${statusLabels[user.trangthai]}</td>
            <td>${formatDateTime(user.ngaytao)}</td>
            <td>${user.langsau ? formatDateTime(user.langsau) : "-"}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editUser(${
                  user.mand
                })">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${
                  user.mand
                })">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `
    )
    .join("");
}

// Filter users based on search and filters
function filterUsers() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const roleFilter = document.getElementById("filterRole").value;
  const statusFilter = document.getElementById("filterStatus").value;

  let filtered = currentUsers;

  // Search filter
  if (searchTerm) {
    filtered = filtered.filter(
      (user) =>
        user.tendangnhap.toLowerCase().includes(searchTerm) ||
        user.hoten.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
  }

  // Role filter
  if (roleFilter) {
    filtered = filtered.filter((user) => user.vaitro === roleFilter);
  }

  // Status filter
  if (statusFilter) {
    filtered = filtered.filter((user) => user.trangthai === statusFilter);
  }

  displayUsers(filtered);
}

// Edit user
async function editUser(mand) {
  try {
    const user = currentUsers.find((u) => u.mand === mand);
    if (!user) {
      showAlert("error", "Không tìm thấy người dùng");
      return;
    }

    editMode = true;
    document.getElementById("modalTitle").innerHTML =
      '<i class="bi bi-pencil"></i> Chỉnh sửa người dùng';

    // Fill form
    document.getElementById("mand").value = user.mand;
    document.getElementById("tendangnhap").value = user.tendangnhap;
    document.getElementById("tendangnhap").setAttribute("readonly", "readonly");
    document.getElementById("hoten").value = user.hoten;
    document.getElementById("email").value = user.email;
    document.getElementById("sodienthoai").value = user.sodienthoai || "";
    document.getElementById("vaitro").value = user.vaitro;
    document.getElementById("trangthai").value = user.trangthai;
    document.getElementById("matkhau").value = "";
    document.getElementById("matkhau").removeAttribute("required");
    document.getElementById("passwordRequired").style.display = "none";
    document.getElementById("passwordHelp").style.display = "none";
    document.getElementById("passwordEditHelp").style.display = "inline";

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById("userModal"));
    modal.show();
  } catch (error) {
    console.error("Error editing user:", error);
  }
}

// Delete user
async function deleteUser(mand) {
  const confirmed = await confirmDelete(
    "Bạn có chắc chắn muốn xóa người dùng này?"
  );
  if (!confirmed) return;

  try {
    await UserAPI.delete(mand);
    showAlert("success", "Xóa người dùng thành công");
    await loadUsers();
  } catch (error) {
    // Error already shown by API
  }
}

// Save user (create or update)
async function saveUser() {
  const form = document.getElementById("userForm");

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  // Remove mand if empty (for create)
  if (!data.mand) {
    delete data.mand;
  }

  // Remove password if empty (for update)
  if (editMode && !data.matkhau) {
    delete data.matkhau;
  }

  // Validate password length if provided
  if (data.matkhau && data.matkhau.length < 6) {
    showAlert("error", "Mật khẩu phải có ít nhất 6 ký tự");
    return;
  }

  // Disable save button
  const saveBtn = document.getElementById("btnSaveUser");
  const originalText = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...';

  try {
    if (editMode) {
      await UserAPI.update(data);
      showAlert("success", "Cập nhật người dùng thành công");
    } else {
      await UserAPI.create(data);
      showAlert("success", "Thêm người dùng thành công");
    }

    // Close modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("userModal")
    );
    modal.hide();

    // Reload users
    await loadUsers();
  } catch (error) {
    // Error already shown by API
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
}

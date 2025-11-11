// Products Management JavaScript

let currentPage = 1;
let productsModal;

document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication (optional for viewing)
  try {
    const result = await AuthAPI.checkAuth();
    if (result.authenticated) {
      updatePageNavbar(result.user);
    }
  } catch (error) {
    // Not logged in, but can still view
  }

  productsModal = new bootstrap.Modal(document.getElementById("productModal"));
  loadProducts();
  loadCategories();
  loadUnits();

  // Search on Enter key
  document
    .getElementById("searchInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchProducts();
      }
    });
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
                <span class="badge bg-secondary">${
                  roleLabels[user.vaitro]
                }</span>
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

  // Show admin menu if user is admin
  if (user.vaitro === "admin") {
    const adminNav = document.getElementById("adminNav");
    if (adminNav) adminNav.style.display = "block";
  }
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

async function loadProducts(page = 1) {
  currentPage = page;
  const tableBody = document.getElementById("productsTableBody");
  const search = document.getElementById("searchInput").value;

  showLoading(tableBody);

  try {
    const response = await ProductAPI.getAll(page, 10, search);

    if (response.success && response.data.length > 0) {
      tableBody.innerHTML = response.data
        .map(
          (product) => `
                <tr>
                    <td>${formatProductCode(product.masp)}</td>
                    <td>${product.tensp}</td>
                    <td>${product.tendm || "-"}</td>
                    <td>${product.tendv || "-"}</td>
                    <td>${formatCurrency(product.giaban)}</td>
                    <td>${formatCurrency(product.giamgia)}</td>
                    <td>${product.xuatxu || "-"}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="viewProduct(${
                          product.masp
                        })" title="Xem chi tiết">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editProduct(${
                          product.masp
                        })" title="Sửa">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${
                          product.masp
                        })" title="Xóa">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `
        )
        .join("");

      renderPagination(response.pagination);
    } else {
      showEmptyState(tableBody, "Không tìm thấy sản phẩm nào");
      document.getElementById("pagination").innerHTML = "";
    }
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

function renderPagination(pagination) {
  const paginationEl = document.getElementById("pagination");
  let html = "";

  // Previous button
  html += `
        <li class="page-item ${pagination.page === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" onclick="loadProducts(${
              pagination.page - 1
            }); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;

  // Page numbers
  for (let i = 1; i <= pagination.totalPages; i++) {
    if (
      i === 1 ||
      i === pagination.totalPages ||
      (i >= pagination.page - 2 && i <= pagination.page + 2)
    ) {
      html += `
                <li class="page-item ${i === pagination.page ? "active" : ""}">
                    <a class="page-link" href="#" onclick="loadProducts(${i}); return false;">${i}</a>
                </li>
            `;
    } else if (i === pagination.page - 3 || i === pagination.page + 3) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  // Next button
  html += `
        <li class="page-item ${
          pagination.page === pagination.totalPages ? "disabled" : ""
        }">
            <a class="page-link" href="#" onclick="loadProducts(${
              pagination.page + 1
            }); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;

  paginationEl.innerHTML = html;
}

async function loadCategories() {
  try {
    const response = await CategoryAPI.getAll();
    const select = document.getElementById("madm");

    if (response.success) {
      select.innerHTML =
        '<option value="">-- Chọn danh mục --</option>' +
        response.data
          .map((cat) => `<option value="${cat.madm}">${cat.tendm}</option>`)
          .join("");
    }
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

async function loadUnits() {
  try {
    const response = await UnitAPI.getAll();
    const select = document.getElementById("madv");

    if (response.success) {
      select.innerHTML =
        '<option value="">-- Chọn đơn vị --</option>' +
        response.data
          .map((unit) => `<option value="${unit.madv}">${unit.tendv}</option>`)
          .join("");
    }
  } catch (error) {
    console.error("Error loading units:", error);
  }
}

function searchProducts() {
  loadProducts(1);
}

function openAddModal() {
  document.getElementById("modalTitle").textContent = "Thêm sản phẩm";
  document.getElementById("productForm").reset();
  document.getElementById("masp").value = "";
  document.getElementById("hinhsp").value = "";
  document.getElementById("imageFile").value = "";
  document.getElementById("imagePreview").innerHTML = `
    <div class="text-center text-muted">
      <i class="bi bi-cloud-upload" style="font-size: 3rem; opacity: 0.3;"></i>
      <div style="font-size: 0.875rem; margin-top: 0.5rem;">
        Chưa chọn ảnh
        <br><small style="font-size: 0.75rem;">Nhấn "Choose File" để chọn</small>
      </div>
    </div>
  `;
}

// Preview image before upload
function previewImage(input) {
  const preview = document.getElementById("imagePreview");

  console.log("previewImage called", input.files);

  if (input.files && input.files[0]) {
    const file = input.files[0];

    // Validate file type
    if (!file.type.startsWith("image/")) {
      preview.innerHTML =
        '<span class="text-danger"><i class="bi bi-exclamation-triangle"></i> Vui lòng chọn file ảnh</span>';
      input.value = "";
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      preview.innerHTML =
        '<span class="text-danger"><i class="bi bi-exclamation-triangle"></i> File quá lớn (max 5MB)</span>';
      input.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      preview.innerHTML = `
        <img src="${e.target.result}" 
             alt="Preview" 
             style="max-width: 100%; max-height: 150px; object-fit: contain;">
        <div class="text-success mt-1" style="font-size: 0.75rem;">
          <i class="bi bi-check-circle"></i>  (${(file.size / 1024).toFixed(
            1
          )} KB)
        </div>
      `;
    };

    reader.onerror = function () {
      preview.innerHTML = '<span class="text-danger">Không thể đọc file</span>';
    };

    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = '<span class="text-muted">Chưa có ảnh</span>';
  }
}

async function viewProduct(masp) {
  try {
    const response = await ProductAPI.getById(masp);
    if (response.success) {
      const product = response.data;
      const details = `
                <div class="modal fade" id="viewModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Chi tiết sản phẩm</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <table class="table">
                                    <tr><th width="200">Mã sản phẩm:</th><td>${
                                      product.masp
                                    }</td></tr>
                                    <tr><th>Tên sản phẩm:</th><td>${
                                      product.tensp
                                    }</td></tr>
                                    <tr><th>Danh mục:</th><td>${
                                      product.tendm || "-"
                                    }</td></tr>
                                    <tr><th>Đơn vị tính:</th><td>${
                                      product.tendv || "-"
                                    }</td></tr>
                                    <tr><th>Giá bán:</th><td>${formatCurrency(
                                      product.giaban
                                    )}</td></tr>
                                    <tr><th>Giảm giá:</th><td>${formatCurrency(
                                      product.giamgia
                                    )}</td></tr>
                                    <tr><th>Xuất xứ:</th><td>${
                                      product.xuatxu || "-"
                                    }</td></tr>
                                    <tr><th>Công dụng:</th><td>${
                                      product.congdung || "-"
                                    }</td></tr>
                                    <tr><th>Cách dùng:</th><td>${
                                      product.cachdung || "-"
                                    }</td></tr>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      document.body.insertAdjacentHTML("beforeend", details);
      const viewModal = new bootstrap.Modal(
        document.getElementById("viewModal")
      );
      viewModal.show();
      document
        .getElementById("viewModal")
        .addEventListener("hidden.bs.modal", function () {
          this.remove();
        });
    }
  } catch (error) {
    console.error("Error viewing product:", error);
  }
}

async function editProduct(masp) {
  try {
    const response = await ProductAPI.getById(masp);

    if (response.success) {
      const product = response.data;
      document.getElementById("modalTitle").textContent = "Sửa sản phẩm";
      document.getElementById("masp").value = product.masp;
      document.getElementById("tensp").value = product.tensp;
      document.getElementById("giaban").value = product.giaban;
      document.getElementById("giamgia").value = product.giamgia;
      document.getElementById("hinhsp").value = product.hinhsp || "";
      document.getElementById("congdung").value = product.congdung || "";
      document.getElementById("xuatxu").value = product.xuatxu || "";
      document.getElementById("cachdung").value = product.cachdung || "";
      document.getElementById("madm").value = product.madm || "";
      document.getElementById("madv").value = product.madv || "";

      // Show current image preview if exists
      const preview = document.getElementById("imagePreview");
      if (product.hinhsp) {
        // Try multiple image paths (new uploads or old assets)
        let imagePath = product.hinhsp;

        // If it's a relative path, try uploads first
        if (!imagePath.startsWith("http") && !imagePath.startsWith("/")) {
          imagePath = `../uploads/products/${imagePath}`;
        }

        preview.innerHTML = `
          <div class="text-center">
            <img src="${imagePath}" 
                 alt="Ảnh sản phẩm" 
                 style="max-width: 100%; max-height: 150px; object-fit: contain; display: block; margin: 0 auto;"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <div style="display: none;" class="text-muted">
              <i class="bi bi-image" style="font-size: 3rem; opacity: 0.3;"></i>
              <div style="font-size: 0.875rem; margin-top: 0.5rem;">
                Ảnh không tồn tại<br>
                <small class="text-muted" style="font-size: 0.75rem;">Vui lòng chọn ảnh mới</small>
              </div>
            </div>
          </div>
        `;
      } else {
        preview.innerHTML = `
          <div class="text-center text-muted">
            <i class="bi bi-image" style="font-size: 3rem; opacity: 0.3;"></i>
            <div style="font-size: 0.875rem; margin-top: 0.5rem;">Chưa có ảnh</div>
          </div>
        `;
      }

      // Clear file input
      document.getElementById("imageFile").value = "";

      productsModal.show();
    }
  } catch (error) {
    console.error("Error loading product:", error);
  }
}

async function saveProduct() {
  const masp = document.getElementById("masp").value;
  const imageFile = document.getElementById("imageFile").files[0];

  try {
    // Upload image first if a new file is selected
    let imagePath = document.getElementById("hinhsp").value; // Keep existing image

    if (imageFile) {
      showAlert("info", "Đang tải ảnh lên...");
      const uploadResponse = await UploadAPI.uploadImage(imageFile);

      if (uploadResponse.success) {
        imagePath = uploadResponse.filename;
        showAlert("success", "Tải ảnh lên thành công!");
      } else {
        showAlert("error", "Tải ảnh lên thất bại: " + uploadResponse.message);
        return; // Stop if image upload fails
      }
    }

    // Prepare product data
    const data = {
      tensp: document.getElementById("tensp").value,
      giaban: parseFloat(document.getElementById("giaban").value),
      giamgia: parseFloat(document.getElementById("giamgia").value) || 0,
      hinhsp: imagePath,
      congdung: document.getElementById("congdung").value,
      xuatxu: document.getElementById("xuatxu").value,
      cachdung: document.getElementById("cachdung").value,
      madm: document.getElementById("madm").value || null,
      madv: document.getElementById("madv").value || null,
    };

    // Save product
    let response;
    if (masp) {
      data.masp = parseInt(masp);
      response = await ProductAPI.update(data);
    } else {
      response = await ProductAPI.create(data);
    }

    if (response.success) {
      showAlert("success", response.message);
      productsModal.hide();
      loadProducts(currentPage);
    }
  } catch (error) {
    console.error("Error saving product:", error);
    showAlert("error", "Có lỗi xảy ra khi lưu sản phẩm");
  }
}

async function deleteProduct(masp) {
  const confirmed = await confirmDelete(
    "Bạn có chắc chắn muốn xóa sản phẩm này?"
  );

  if (confirmed) {
    try {
      const response = await ProductAPI.delete(masp);

      if (response.success) {
        showAlert("success", response.message);
        loadProducts(currentPage);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }
}

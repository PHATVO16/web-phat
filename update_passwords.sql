-- ========================================
-- UPDATE PASSWORD CHO CÁC TÀI KHOẢN
-- Password: 123456 cho tất cả tài khoản
-- ========================================

USE qlithuoc_7_10;

-- Update password cho admin (password: 123456)
UPDATE nguoidung SET matkhau = '$2y$10$WOi7UjF4n/7xNhExFwFHvuuWbtmnqtr/QXAM1GUNU554xE.TJD/fS' WHERE tendangnhap = 'admin';

-- Update password cho nhanvien1 (password: 123456)
UPDATE nguoidung SET matkhau = '$2y$10$TGt5r8b5iJU1yF0Uzwqhcu1R7RkxWG8IdvJVN1oIIx/HwejFV6DRe' WHERE tendangnhap = 'nhanvien1';

-- Update password cho khachhang1 (password: 123456)
UPDATE nguoidung SET matkhau = '$2y$10$5TqUobRDZWwEn1go1IRDd.tuarFe6oUxNqroTekAZnb0fInEZNPW6' WHERE tendangnhap = 'khachhang1';

-- Update password cho khachhang2 (password: 123456)
UPDATE nguoidung SET matkhau = '$2y$10$XupryJskBxYdQVLXAv60V.sc0Zmzq9RaZtbNsVtD8z9xd0B1ZMokG' WHERE tendangnhap = 'khachhang2';

-- Kiểm tra kết quả
SELECT tendangnhap, hoten, email, vaitro, trangthai FROM nguoidung;


# Chức năng Đăng Bài Viết Chuẩn SEO

## 1. Tổng quan chức năng
Chức năng đăng bài viết chuẩn SEO cho phép quản trị viên tạo, chỉnh sửa, và đánh giá mức độ tối ưu SEO của từng bài viết trên hệ thống. Hệ thống sẽ tự động phân tích các yếu tố SEO quan trọng (tiêu đề, mô tả, nội dung, hình ảnh, URL, mạng xã hội, từ khóa...) và chấm điểm, đưa ra gợi ý cải thiện.

## 2. Các trường (field) liên quan trong Database
Các trường SEO được lưu trong bảng `posts`:

| Tên trường           | Kiểu dữ liệu | Ý nghĩa |
|----------------------|-------------|---------|
| title                | string      | Tiêu đề bài viết |
| slug                 | string      | Đường dẫn thân thiện (SEO URL) |
| description          | text        | Mô tả ngắn bài viết |
| content              | text        | Nội dung bài viết |
| meta_title           | string      | Meta title (thẻ tiêu đề SEO) |
| meta_description     | text        | Meta description (thẻ mô tả SEO) |
| meta_keywords        | string      | Meta keywords (từ khóa SEO) |
| canonical_url        | string      | Canonical URL (tránh trùng lặp nội dung) |
| og_title             | string      | Open Graph title (SEO mạng xã hội) |
| og_description       | text        | Open Graph description |
| og_image             | string      | Open Graph image |
| twitter_title        | string      | Twitter Card title |
| twitter_description  | text        | Twitter Card description |
| twitter_image        | string      | Twitter Card image |
| structured_data      | json        | Dữ liệu cấu trúc Schema.org (Article) |
| reading_time         | integer     | Thời gian đọc ước tính (phút) |
| word_count           | integer     | Số lượng từ trong bài viết |
| seo_score            | integer     | Điểm SEO tổng thể (0-100) |
| seo_grade            | string      | Xếp hạng SEO (A+, A, B, C, D, F) |

## 3. Luồng hoạt động tổng thể
### Backend (Laravel)
- Khi tạo/cập nhật bài viết, backend sẽ:
  1. Validate dữ liệu (bao gồm các trường SEO).
  2. Làm sạch nội dung (sanitize).
  3. Tính toán số từ, thời gian đọc.
  4. Phân tích SEO qua `SeoService`:
     - Chấm điểm từng yếu tố (tiêu đề, mô tả, nội dung, hình ảnh, URL, mạng xã hội...)
     - Tổng hợp điểm, xếp hạng, phát hiện vấn đề và gợi ý cải thiện.
     - Phân tích mật độ từ khóa nếu có.
  5. Lưu các trường SEO vào DB.
  6. Sinh structured data (Schema.org Article) và lưu vào trường `structured_data`.
  7. Trả về dữ liệu bài viết kèm kết quả phân tích SEO cho frontend.

- Có API riêng để lấy phân tích SEO chi tiết: `/api/posts/{post}/seo-analysis`
- Có lệnh artisan `seo:generate-sitemap` để sinh sitemap.xml chuẩn SEO cho toàn site.

### Frontend (Next.js/React)
- Form tạo/sửa bài viết hiển thị đầy đủ các trường SEO.
- Khi nhập liệu, frontend tính toán điểm SEO realtime (đồng bộ thuật toán với backend).
- Có popup/section phân tích SEO chi tiết (giao diện trực quan, hiển thị điểm số, xếp hạng, vấn đề, gợi ý, mật độ từ khóa...)
- Khi submit, chỉ gửi dữ liệu, backend sẽ tính toán lại điểm SEO và trả về kết quả cuối cùng.
- Danh sách bài viết hiển thị cột điểm SEO, cho phép sắp xếp theo điểm SEO.

## 4. Giải thích thuật toán chấm điểm SEO (SeoService.php)
### Tổng điểm tối đa: 100
- **Tiêu đề (title):** tối đa 25 điểm
  - Độ dài 30-60 ký tự: 25 điểm
  - Độ dài 20-70 ký tự: 20 điểm
  - Có tiêu đề: 10 điểm
  - Gợi ý: nên dùng Title Case, độ dài hợp lý
- **Meta description:** tối đa 20 điểm
  - Độ dài 120-160 ký tự: 20 điểm
  - Độ dài 100-180 ký tự: 15 điểm
  - Có mô tả: 10 điểm
- **Nội dung:** tối đa 25 điểm
  - Từ 300 từ trở lên: 15 điểm
  - Có heading (H1-H6): 5 điểm
  - Có >=3 đoạn: 5 điểm
- **Hình ảnh:** tối đa 15 điểm
  - Có hình ảnh: 10 điểm
  - Có >=3 hình: +5 điểm
  - Hình phải có alt text
- **URL/Slug:** tối đa 10 điểm
  - Độ dài 3-60 ký tự: 10 điểm
  - Đúng định dạng (chỉ chữ thường, số, gạch ngang)
- **Mạng xã hội (Open Graph):** tối đa 5 điểm
  - Đủ og_title, og_description, og_image

### Xếp hạng SEO (seo_grade)
- A+: >=90
- A: >=80
- B: >=70
- C: >=60
- D: >=50
- F: <50

### Phân tích mật độ từ khóa
- Mật độ lý tưởng: 1-3% tổng số từ
- Trạng thái: optimal (tối ưu), low (thấp), high (cao)

### Gợi ý cải thiện
- Hệ thống tự động phát hiện các vấn đề (ví dụ: thiếu alt cho ảnh, tiêu đề quá ngắn, thiếu heading, mô tả quá dài...) và đưa ra gợi ý cụ thể.

## 5. API liên quan
- `POST /api/posts` : Tạo bài viết mới (tính toán SEO tự động)
- `PUT /api/posts/{id}` : Cập nhật bài viết (tính toán SEO tự động)
- `GET /api/posts/{id}/seo-analysis` : Lấy phân tích SEO chi tiết
- `POST /api/posts/generate-sitemap` : Sinh sitemap.xml

## 6. Giao diện quản trị (frontend-admin)
- Quản trị viên có thể:
  - Xem, tạo, sửa, xóa bài viết với đầy đủ trường SEO
  - Xem điểm SEO, xếp hạng, phân tích chi tiết, gợi ý cải thiện
  - Sắp xếp danh sách bài viết theo điểm SEO
  - Xem mật độ từ khóa, structured data, preview mạng xã hội

---

**Tài liệu này mô tả chi tiết toàn bộ chức năng đăng bài viết chuẩn SEO, các trường dữ liệu, thuật toán chấm điểm và luồng hoạt động backend/frontend.** 
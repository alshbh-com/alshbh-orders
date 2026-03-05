

# خطة التنفيذ - المرحلة الأولى: قاعدة البيانات والبنية الأساسية

## 1. قاعدة البيانات (Supabase Migration)

إنشاء الجداول التالية بترتيب التبعيات:

**الجداول:**
- `profiles` — بيانات المستخدم (id يرتبط بـ auth.users، full_name، role يُدار عبر user_roles)
- `user_roles` — جدول أدوار منفصل (user_id, role enum: admin/merchant)
- `stores` — المتاجر (owner_id, store_name, store_slug, logo_url, whatsapp_number, theme, primary_color, secondary_color, points_balance, is_active)
- `categories` — تصنيفات المنتجات (store_id, name)
- `products` — المنتجات (store_id, category_id, name, description, price, main_image_url, is_featured, sales_count)
- `product_images` — صور إضافية للمنتج
- `orders` — الطلبات (store_id, customer_name, customer_phone, customer_address, total_price, status enum)
- `order_items` — تفاصيل الطلب
- `reviews` — تقييمات المنتجات
- `point_transactions` — سجل عمليات النقاط
- `notifications` — إشعارات التجار
- `pages` — صفحات المنصة الثابتة
- `complaints` — الشكاوى والرسائل
- `templates` — القوالب المتاحة

**الدوال والـ Triggers:**
- دالة `has_role()` لفحص الأدوار بأمان (SECURITY DEFINER)
- دالة `handle_new_user()` لإنشاء profile تلقائي عند التسجيل
- دالة `deduct_point_on_order()` لخصم نقطة عند كل طلب
- سياسات RLS لكل الجداول

**Storage:**
- إنشاء bucket باسم `product-images` و `store-logos`

**بيانات أولية:**
- إدراج 4 قوالب (مطاعم، ملابس، عطور، سوبر ماركت)

## 2. البنية الأساسية للكود

**ملفات التكوين:**
- `src/integrations/supabase/client.ts` — موجود بالفعل
- إعداد RTL واللغة العربية في `index.html` و `index.css`

**الصفحات الأساسية (React Router):**
- `/` — الصفحة الرئيسية للمنصة
- `/auth` — تسجيل دخول / إنشاء حساب
- `/dashboard` — لوحة تحكم التاجر
- `/admin` — لوحة تحكم الأدمن
- `/store/:slug` — واجهة المتجر للعملاء
- `/about` — عن المنصة
- `/terms` — سياسة الاستخدام
- `/contact` — تواصل معانا

**المكونات الأساسية:**
- `AuthProvider` — إدارة حالة المصادقة
- `ProtectedRoute` — حماية الصفحات
- `Layout` — التخطيط العام مع navbar وfooter
- `AlshbhWatermark` — العلامة المائية في أسفل كل متجر

**الخطوات:**
1. تشغيل migration لإنشاء كل الجداول والدوال والسياسات والـ Storage
2. إنشاء AuthContext وصفحة المصادقة
3. إنشاء الصفحة الرئيسية للمنصة بالعامية المصرية
4. إعداد التوجيه (routing) لكل الصفحات
5. إنشاء المكونات المشتركة (Layout, Watermark, RTL)

هذه المرحلة تؤسس البنية التحتية الكاملة، والمراحل التالية ستبني عليها لوحات التحكم وواجهات المتاجر.


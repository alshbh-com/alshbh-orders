import Layout from "@/components/Layout";

export default function Terms() {
  return (
    <Layout>
      <div className="container py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-6">سياسة الاستخدام</h1>
        <div className="prose prose-lg max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. مقدمة</h2>
            <p>باستخدامك لمنصة الشبح ميديا (Alshbh Media) أنت بتوافق على الشروط والأحكام دي. لو مش موافق يبقى مينفعش تستخدم المنصة.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">2. الحسابات</h2>
            <p>كل تاجر مسؤول عن حسابه وبياناته ومنتجاته. المنصة مش مسؤولة عن أي محتوى يتم نشره من التجار.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">3. نظام النقاط</h2>
            <p>كل طلب بيخصم نقطة واحدة من رصيد التاجر. لو الرصيد خلص، المتجر يتوقف عن استقبال الطلبات لحد ما يتم شحن النقاط.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">4. المنتجات</h2>
            <p>التاجر مسؤول عن صحة المعلومات والصور الخاصة بمنتجاته. ممنوع نشر منتجات مخالفة للقانون.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">5. الخصوصية</h2>
            <p>بيانات العملاء والتجار محمية ومش بنشاركها مع أي طرف تالت من غير إذن.</p>
          </section>
        </div>
      </div>
    </Layout>
  );
}

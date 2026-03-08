import Layout from "@/components/Layout";
import { Store, Users, ShoppingBag, Zap } from "lucide-react";

export default function About() {
  return (
    <Layout>
      <div className="container py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-6">عن منصة الشبح ميديا - Alshbh Media</h1>
        <p className="text-lg text-muted-foreground mb-8">
          الشبح ميديا (Alshbh Media) هي منصة متاجر إلكترونية مصرية بالكامل، بنيناها عشان نساعد أي تاجر يعمل متجره الخاص ويبدأ يبيع أونلاين من غير ما يحتاج أي خبرة تقنية أو يدفع مبالغ كبيرة.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {[
            { icon: Store, title: "متاجر احترافية", desc: "قوالب جاهزة ومتنوعة لكل أنواع التجارة" },
            { icon: Users, title: "سهولة الاستخدام", desc: "واجهة بسيطة بالعامية المصرية - مفيش تعقيد" },
            { icon: ShoppingBag, title: "نظام طلبات متكامل", desc: "استقبل طلباتك وتابعها من لوحة التحكم" },
            { icon: Zap, title: "نظام نقاط ذكي", desc: "ادفع بس لما تستقبل طلبات - من غير اشتراكات شهرية" },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border border-border">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-4">إزاي بتشتغل؟</h2>
        <ol className="space-y-4 text-muted-foreground mb-8">
          <li className="flex gap-3"><span className="font-bold text-primary text-lg">1.</span> سجل حساب جديد كتاجر</li>
          <li className="flex gap-3"><span className="font-bold text-primary text-lg">2.</span> اعمل متجرك واختار القالب اللي يناسبك</li>
          <li className="flex gap-3"><span className="font-bold text-primary text-lg">3.</span> ضيف منتجاتك بالصور والأسعار</li>
          <li className="flex gap-3"><span className="font-bold text-primary text-lg">4.</span> شارك رابط متجرك مع عملائك</li>
          <li className="flex gap-3"><span className="font-bold text-primary text-lg">5.</span> استقبل طلباتك وابدأ بيع!</li>
        </ol>
      </div>
    </Layout>
  );
}
